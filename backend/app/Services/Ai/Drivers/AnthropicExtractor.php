<?php

namespace App\Services\Ai\Drivers;

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\AuthenticationException;
use Anthropic\Core\Exceptions\PermissionDeniedException;
use Anthropic\Core\Exceptions\RateLimitException;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\DraftPrompt;
use App\Services\Ai\ExtractedDraft;
use App\Services\Ai\InvoiceDraftExtractor;
use Illuminate\Support\Facades\Log;

/**
 * Claude through the official SDK, with structured outputs (the reply is
 * constrained to the schema) and server-side refusal fallback.
 */
class AnthropicExtractor implements InvoiceDraftExtractor
{
    /**
     * @param  array{key?: string|null, model?: string|null, effort?: string|null}  $config
     */
    public function __construct(private string $provider, private array $config, private float $timeout) {}

    public function extract(string $prompt, array $context): ExtractedDraft
    {
        if (empty($this->config['key']) || empty($this->config['model'])) {
            throw AiUnavailableException::notConfigured();
        }

        $client = new Client(apiKey: $this->config['key'], requestOptions: ['timeout' => $this->timeout, 'maxRetries' => 2]);

        try {
            $message = $client->beta->messages->create(
                model: $this->config['model'],
                maxTokens: 16000,
                system: DraftPrompt::SYSTEM,
                messages: [['role' => 'user', 'content' => DraftPrompt::userMessage($prompt, $context)]],
                outputConfig: [
                    'effort' => $this->config['effort'] ?? 'low',
                    'format' => ['type' => 'json_schema', 'schema' => DraftPrompt::SCHEMA],
                ],
                fallbacks: 'default',
                betas: ['server-side-fallback-2026-07-01'],
            );
        } catch (AuthenticationException|PermissionDeniedException $e) {
            Log::error('Anthropic rejected the API key', ['error' => $e->getMessage()]);
            throw AiUnavailableException::auth();
        } catch (RateLimitException) {
            throw AiUnavailableException::rateLimited();
        } catch (APIStatusException|APIConnectionException $e) {
            Log::warning('Anthropic request failed', ['error' => $e->getMessage()]);
            throw AiUnavailableException::unavailable();
        }

        if ($message->stopReason === 'refusal') {
            throw AiUnavailableException::refused();
        }

        $text = null;
        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $text = $block->text;
                break;
            }
        }

        if ($message->stopReason === 'max_tokens') {
            throw AiUnavailableException::invalidOutput();
        }

        return new ExtractedDraft(
            data: JsonReply::decode($text),
            model: $message->model,
            provider: $this->provider,
            inputTokens: $message->usage->inputTokens,
            outputTokens: $message->usage->outputTokens,
        );
    }
}
