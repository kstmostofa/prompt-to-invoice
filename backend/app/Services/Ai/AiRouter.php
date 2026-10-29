<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

/**
 * The extractor the app uses: the active provider, then the fallback when
 * the active one is down, rate limited or misconfigured. A refusal or a bad
 * draft is not retried elsewhere: another model would read the same words.
 */
class AiRouter implements InvoiceDraftExtractor
{
    public function __construct(private AiProviders $providers) {}

    public function extract(string $prompt, array $context): ExtractedDraft
    {
        $settings = $this->providers->settings();

        try {
            return $this->providers->make($settings['provider'], $settings['model'])->extract($prompt, $context);
        } catch (AiUnavailableException $e) {
            $fallback = $settings['fallback'];

            if (! $e->worthFallingBack() || ! $fallback || $fallback === $settings['provider'] || ! $this->providers->isConfigured($fallback)) {
                throw $e;
            }

            Log::info('AI provider failed, using fallback', ['provider' => $settings['provider'], 'reason' => $e->reason, 'fallback' => $fallback]);

            return $this->providers->make($fallback, $settings['fallback_model'])->extract($prompt, $context);
        }
    }
}
