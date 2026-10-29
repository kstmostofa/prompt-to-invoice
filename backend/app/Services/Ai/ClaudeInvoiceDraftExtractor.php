<?php

namespace App\Services\Ai;

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\RateLimitException;
use Illuminate\Support\Facades\Log;

/**
 * Claude with structured outputs: the response is constrained to SCHEMA, so
 * it always parses. Refusals fall back server-side to Anthropic's default
 * substitute model before they reach us.
 */
class ClaudeInvoiceDraftExtractor implements InvoiceDraftExtractor
{
    private const SYSTEM = <<<'PROMPT'
You turn a freelancer's or small business's description of work into the fields of an invoice draft. The owner reviews the draft before anything is saved or sent.

Rules:
- Extract only what the description states or clearly implies. Never invent work, quantities, rates or clients.
- If a rate or price is missing for a line, set unit_price to 0 and add a warning saying which line needs a price.
- A flat fee ("logo design for $500") is one line with quantity 1. Hours, days or units become the quantity, with the unit ("h", "day", "page", ...).
- Write line descriptions as a client would expect to read them on an invoice: short, specific, capitalised.
- Client: if the description refers to one of the existing clients, set client.match_id to that client's id and leave the other client fields null. Otherwise set match_id to null and fill name, company and email from the description (null where not given).
- Currency: "USD" for $, dollars or USD; "EUR" for €, euros or EUR; null if not stated.
- Dates are YYYY-MM-DD. Resolve relative dates ("due in 30 days", "net 15", "end of the month", "next Friday") against today's date. issue_date is null unless a date is stated. due_date is null unless the description says when payment is due.
- tax_rate is a percentage, only if stated (e.g. "plus 19% VAT" -> 19); otherwise null.
- discount_type is "percent" or "amount" only if a discount is stated; otherwise null, with discount_value null.
- Do not calculate line amounts or totals; the system does that.
- notes: a short note to the client only if the description asks for one (e.g. a project reference or thank-you); otherwise null.
- warnings: anything the owner should check, such as an ambiguous client or a missing price. Empty list if nothing.
PROMPT;

    /**
     * Every field required, nullable where absent: structured outputs need
     * a closed schema.
     */
    private const SCHEMA = [
        'type' => 'object',
        'additionalProperties' => false,
        'required' => ['client', 'currency', 'issue_date', 'due_date', 'items', 'discount_type', 'discount_value', 'tax_rate', 'notes', 'warnings'],
        'properties' => [
            'client' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['match_id', 'name', 'company', 'email'],
                'properties' => [
                    'match_id' => ['anyOf' => [['type' => 'integer'], ['type' => 'null']]],
                    'name' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
                    'company' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
                    'email' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
                ],
            ],
            'currency' => ['anyOf' => [['type' => 'string', 'enum' => ['USD', 'EUR']], ['type' => 'null']]],
            'issue_date' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
            'due_date' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
            'items' => [
                'type' => 'array',
                'items' => [
                    'type' => 'object',
                    'additionalProperties' => false,
                    'required' => ['description', 'quantity', 'unit', 'unit_price'],
                    'properties' => [
                        'description' => ['type' => 'string'],
                        'quantity' => ['type' => 'number'],
                        'unit' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
                        'unit_price' => ['type' => 'number'],
                    ],
                ],
            ],
            'discount_type' => ['anyOf' => [['type' => 'string', 'enum' => ['percent', 'amount']], ['type' => 'null']]],
            'discount_value' => ['anyOf' => [['type' => 'number'], ['type' => 'null']]],
            'tax_rate' => ['anyOf' => [['type' => 'number'], ['type' => 'null']]],
            'notes' => ['anyOf' => [['type' => 'string'], ['type' => 'null']]],
            'warnings' => ['type' => 'array', 'items' => ['type' => 'string']],
        ],
    ];

    public function __construct(
        private ?string $apiKey,
        private string $model,
        private string $effort,
        private float $timeout,
    ) {}

    public function extract(string $prompt, array $context): ExtractedDraft
    {
        if (! $this->apiKey) {
            throw new AiUnavailableException('AI generation is not set up yet. Create the invoice by hand, or ask your administrator to add an Anthropic API key.', 'not_configured');
        }

        $client = new Client(apiKey: $this->apiKey, requestOptions: ['timeout' => $this->timeout, 'maxRetries' => 2]);

        // Context first, as data; the owner's words last, inside their own tag.
        $userMessage = "Today is {$context['today']}. The business invoices in {$context['currency']} by default, due {$context['payment_terms_days']} days after issue.\n\n"
            ."Existing clients (JSON):\n<clients>\n".json_encode($context['clients'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n</clients>\n\n"
            ."Description of the work:\n<description>\n{$prompt}\n</description>";

        try {
            $message = $client->beta->messages->create(
                model: $this->model,
                maxTokens: 16000,
                system: self::SYSTEM,
                messages: [['role' => 'user', 'content' => $userMessage]],
                outputConfig: [
                    'effort' => $this->effort,
                    'format' => ['type' => 'json_schema', 'schema' => self::SCHEMA],
                ],
                fallbacks: 'default',
                betas: ['server-side-fallback-2026-07-01'],
            );
        } catch (AuthenticationException $e) {
            Log::error('Anthropic authentication failed', ['error' => $e->getMessage()]);
            throw new AiUnavailableException('AI generation is not available right now. Please create the invoice by hand.', 'auth');
        } catch (RateLimitException) {
            throw new AiUnavailableException('AI generation is busy. Try again in a minute.', 'rate_limited');
        } catch (APIStatusException|APIConnectionException $e) {
            Log::warning('Anthropic request failed', ['error' => $e->getMessage()]);
            throw new AiUnavailableException('AI generation is not available right now. Try again, or create the invoice by hand.', 'unavailable');
        }

        if ($message->stopReason === 'refusal') {
            throw new AiUnavailableException('That description could not be turned into an invoice. Try rewording it.', 'refused');
        }

        $data = null;
        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $data = json_decode($block->text, true);
                break;
            }
        }

        if (! is_array($data) || $message->stopReason === 'max_tokens') {
            throw new AiUnavailableException('The draft came back incomplete. Try a shorter description.', 'invalid_output');
        }

        return new ExtractedDraft(
            data: $data,
            model: $message->model,
            inputTokens: $message->usage->inputTokens,
            outputTokens: $message->usage->outputTokens,
        );
    }
}
