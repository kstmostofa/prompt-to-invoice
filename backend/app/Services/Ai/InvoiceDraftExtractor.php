<?php

namespace App\Services\Ai;

/**
 * Turns a description of work into raw invoice fields. Implementations only
 * extract; InvoiceDraftService checks every value and does all arithmetic.
 */
interface InvoiceDraftExtractor
{
    /**
     * @param  array{today: string, currency: string, payment_terms_days: int, clients: list<array<string, mixed>>}  $context
     *
     * @throws AiUnavailableException
     */
    public function extract(string $prompt, array $context): ExtractedDraft;
}
