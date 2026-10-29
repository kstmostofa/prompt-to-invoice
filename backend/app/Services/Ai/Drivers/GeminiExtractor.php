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
 * Google Gemini generateContent, with JSON output constrained to the schema.
 */
class GeminiExtractor implements InvoiceDraftExtractor
{
    /**
     * @param  array{key?: string|null, model?: string|null, base_url?: string|null}  $config
     */
    public function __construct(private string $provider, private array $config, private float $timeout) {}

    public function extract(string $prompt, array $context): ExtractedDraft
    {
        if (empty($this->config['key']) || empty($this->config['model'])) {
            throw AiUnavailableException::notConfigured();
        }

        $base = rtrim($this->config['base_url'] ?? 'https://generativelanguage.googleapis.com/v1beta', '/');

        try {
            $response = Http::withHeaders(['x-goog-api-key' => $this->config['key']])
                ->acceptJson()
                ->timeout((int) ceil($this->timeout))
                ->retry(2, 500, fn ($exception) => $exception instanceof ConnectionException, throw: false)
                ->post("{$base}/models/{$this->config['model']}:generateContent", [
                    'systemInstruction' => ['parts' => [['text' => DraftPrompt::SYSTEM]]],
                    'contents' => [['role' => 'user', 'parts' => [['text' => DraftPrompt::userMessage($prompt, $context)]]]],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'responseJsonSchema' => DraftPrompt::SCHEMA,
                    ],
                ]);
        } catch (ConnectionException $e) {
            Log::warning("{$this->provider} unreachable", ['error' => $e->getMessage()]);
            throw AiUnavailableException::unavailable();
        }

        HttpErrors::throwFor($this->provider, $response);

        if ($response->json('promptFeedback.blockReason') !== null) {
            throw AiUnavailableException::refused();
        }

        $candidate = $response->json('candidates.0');
        $finish = $candidate['finishReason'] ?? null;
        if (in_array($finish, ['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION'], true)) {
            throw AiUnavailableException::refused();
        }
        if ($finish === 'MAX_TOKENS') {
            throw AiUnavailableException::invalidOutput();
        }

        $text = '';
        foreach ((array) ($candidate['content']['parts'] ?? []) as $part) {
            $text .= is_array($part) && is_string($part['text'] ?? null) ? $part['text'] : '';
        }

        return new ExtractedDraft(
            data: JsonReply::decode($text),
            model: (string) ($response->json('modelVersion') ?? $this->config['model']),
            provider: $this->provider,
            inputTokens: (int) $response->json('usageMetadata.promptTokenCount', 0),
            outputTokens: (int) $response->json('usageMetadata.candidatesTokenCount', 0) + (int) $response->json('usageMetadata.thoughtsTokenCount', 0),
        );
    }
}
