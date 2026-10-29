<?php

namespace App\Services\Ai\Drivers;

use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\DraftPrompt;
use App\Services\Ai\ExtractedDraft;
use App\Services\Ai\InvoiceDraftExtractor;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OpenAI Chat Completions, and every API that speaks it: OpenRouter, Groq,
 * Mistral, DeepSeek, xAI, Ollama. "schema" mode sends a strict JSON schema;
 * "object" mode, for APIs without it, puts the schema in the instructions.
 */
class OpenAiCompatibleExtractor implements InvoiceDraftExtractor
{
    /**
     * @param  array{key?: string|null, model?: string|null, base_url?: string|null, json_mode?: string|null}  $config
     */
    public function __construct(private string $provider, private array $config, private float $timeout) {}

    public function extract(string $prompt, array $context): ExtractedDraft
    {
        if (empty($this->config['key']) || empty($this->config['model']) || empty($this->config['base_url'])) {
            throw AiUnavailableException::notConfigured();
        }

        $schemaMode = ($this->config['json_mode'] ?? 'schema') !== 'object';

        $body = [
            'model' => $this->config['model'],
            'messages' => [
                ['role' => 'system', 'content' => $schemaMode ? DraftPrompt::SYSTEM : DraftPrompt::systemWithSchema()],
                ['role' => 'user', 'content' => DraftPrompt::userMessage($prompt, $context)],
            ],
            'response_format' => $schemaMode
                ? ['type' => 'json_schema', 'json_schema' => ['name' => 'invoice_draft', 'strict' => true, 'schema' => DraftPrompt::SCHEMA]]
                : ['type' => 'json_object'],
        ];

        try {
            $response = Http::withToken($this->config['key'])
                ->acceptJson()
                ->timeout((int) ceil($this->timeout))
                ->retry(2, 500, fn ($exception) => $exception instanceof ConnectionException, throw: false)
                ->post(rtrim($this->config['base_url'], '/').'/chat/completions', $body);
        } catch (ConnectionException $e) {
            Log::warning("{$this->provider} unreachable", ['error' => $e->getMessage()]);
            throw AiUnavailableException::unavailable();
        }

        HttpErrors::throwFor($this->provider, $response);

        $choice = $response->json('choices.0');
        if (! empty($choice['message']['refusal'] ?? null) || ($choice['finish_reason'] ?? null) === 'content_filter') {
            throw AiUnavailableException::refused();
        }
        if (($choice['finish_reason'] ?? null) === 'length') {
            throw AiUnavailableException::invalidOutput();
        }

        return new ExtractedDraft(
            data: JsonReply::decode($choice['message']['content'] ?? null),
            model: (string) ($response->json('model') ?? $this->config['model']),
            provider: $this->provider,
            inputTokens: (int) $response->json('usage.prompt_tokens', 0),
            outputTokens: (int) $response->json('usage.completion_tokens', 0),
        );
    }
}
