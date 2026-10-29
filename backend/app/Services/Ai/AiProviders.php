<?php

namespace App\Services\Ai;

use App\Models\PlatformSetting;
use App\Services\Ai\Drivers\AnthropicExtractor;
use App\Services\Ai\Drivers\GeminiExtractor;
use App\Services\Ai\Drivers\OpenAiCompatibleExtractor;
use InvalidArgumentException;

/**
 * The configured AI providers, and which one is active. Keys come from
 * config/ai.php; the admin's choice of provider, model and fallback from
 * platform_settings, falling back to the environment.
 */
class AiProviders
{
    public const SETTING = 'ai';

    /**
     * Every provider with whether it can be used, without its key.
     *
     * @return list<array{id: string, label: string, driver: string, configured: bool, default_model: string|null, models: list<string>}>
     */
    public function all(): array
    {
        $providers = [];

        foreach ((array) config('ai.providers') as $id => $provider) {
            $providers[] = [
                'id' => (string) $id,
                'label' => (string) $provider['label'],
                'driver' => (string) $provider['driver'],
                'configured' => $this->isConfigured((string) $id),
                'default_model' => $provider['model'] ?? null,
                'models' => array_values($provider['models'] ?? []),
            ];
        }

        return $providers;
    }

    public function exists(string $id): bool
    {
        return is_array(config("ai.providers.{$id}"));
    }

    public function isConfigured(string $id): bool
    {
        $provider = config("ai.providers.{$id}");

        return is_array($provider)
            && ! empty($provider['key'])
            && ! empty($provider['model'])
            && ($provider['driver'] !== 'openai' || ! empty($provider['base_url']));
    }

    /**
     * @return array{provider: string, model: string|null, fallback: string|null, fallback_model: string|null}
     */
    public function settings(): array
    {
        $saved = (array) PlatformSetting::get(self::SETTING, []);

        return [
            'provider' => $saved['provider'] ?? (string) config('ai.provider'),
            'model' => $saved['model'] ?? null,
            'fallback' => array_key_exists('fallback', $saved) ? $saved['fallback'] : (config('ai.fallback') ?: null),
            'fallback_model' => $saved['fallback_model'] ?? null,
        ];
    }

    /**
     * @param  array{provider: string, model?: string|null, fallback?: string|null, fallback_model?: string|null}  $settings
     */
    public function save(array $settings): void
    {
        PlatformSetting::put(self::SETTING, [
            'provider' => $settings['provider'],
            'model' => $settings['model'] ?? null,
            'fallback' => $settings['fallback'] ?? null,
            'fallback_model' => $settings['fallback_model'] ?? null,
        ]);
    }

    /**
     * A driver for one provider, with an optional model override.
     */
    public function make(string $id, ?string $model = null): InvoiceDraftExtractor
    {
        $config = config("ai.providers.{$id}");

        if (! is_array($config)) {
            throw new InvalidArgumentException("Unknown AI provider [{$id}].");
        }

        if ($model) {
            $config['model'] = $model;
        }

        $timeout = (float) config('ai.timeout', 60);

        return match ($config['driver']) {
            'anthropic' => new AnthropicExtractor($id, $config, $timeout),
            'gemini' => new GeminiExtractor($id, $config, $timeout),
            'openai' => new OpenAiCompatibleExtractor($id, $config, $timeout),
            default => throw new InvalidArgumentException("Unknown AI driver [{$config['driver']}]."),
        };
    }
}
