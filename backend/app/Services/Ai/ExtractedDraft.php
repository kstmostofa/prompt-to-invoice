<?php

namespace App\Services\Ai;

/**
 * What the model returned, before any checking, and what it cost.
 */
final readonly class ExtractedDraft
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public array $data,
        public string $model,
        public string $provider = 'anthropic',
        public int $inputTokens = 0,
        public int $outputTokens = 0,
    ) {}
}
