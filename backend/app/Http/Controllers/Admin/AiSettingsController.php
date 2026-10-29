<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AiGeneration;
use App\Services\Ai\AiProviders;
use App\Services\Ai\AiUnavailableException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * Which AI provider drafts invoices, with usage per provider and a test run.
 * Keys are never shown or stored here: they live in the environment.
 */
class AiSettingsController extends Controller
{
    private const SAMPLE_PROMPT = '10 hours of consulting for Acme Corp at $120/hour and a $250 workshop, due in 30 days';

    public function __construct(private AiProviders $providers) {}

    public function show(): JsonResponse
    {
        $since = now()->subDays(30);

        $usage = AiGeneration::query()
            ->where('created_at', '>=', $since)
            ->select('provider')
            ->selectRaw('COUNT(*) as requests')
            ->selectRaw("SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as succeeded")
            ->selectRaw('SUM(input_tokens) as input_tokens, SUM(output_tokens) as output_tokens')
            ->selectRaw('AVG(duration_ms) as avg_duration_ms')
            ->groupBy('provider')
            ->get()
            ->keyBy('provider');

        return response()->json([
            'data' => [
                'settings' => $this->providers->settings(),
                'providers' => array_map(fn (array $provider): array => [
                    ...$provider,
                    'usage_30d' => [
                        'requests' => (int) ($usage[$provider['id']]->requests ?? 0),
                        'succeeded' => (int) ($usage[$provider['id']]->succeeded ?? 0),
                        'input_tokens' => (int) ($usage[$provider['id']]->input_tokens ?? 0),
                        'output_tokens' => (int) ($usage[$provider['id']]->output_tokens ?? 0),
                        'avg_duration_ms' => (int) round((float) ($usage[$provider['id']]->avg_duration_ms ?? 0)),
                    ],
                ], $this->providers->all()),
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $ids = array_column($this->providers->all(), 'id');

        $validated = $request->validate([
            'provider' => ['required', 'string', Rule::in($ids)],
            'model' => ['nullable', 'string', 'max:120'],
            'fallback' => ['nullable', 'string', Rule::in($ids), 'different:provider'],
            'fallback_model' => ['nullable', 'string', 'max:120'],
        ], [
            'fallback.different' => 'The fallback must be a different provider.',
        ]);

        validator($validated)->after(function (Validator $validator) use ($validated): void {
            if (! $this->providers->isConfigured($validated['provider'])) {
                $validator->errors()->add('provider', 'This provider has no API key (or model) set on the server.');
            }
            if (! empty($validated['fallback']) && ! $this->providers->isConfigured($validated['fallback'])) {
                $validator->errors()->add('fallback', 'This provider has no API key (or model) set on the server.');
            }
        })->validate();

        /** @var array{provider: string, model?: string|null, fallback?: string|null, fallback_model?: string|null} $validated */
        $this->providers->save($validated);

        return $this->successWithData($this->providers->settings(), 'AI settings saved');
    }

    /**
     * Run a sample description through one provider, without saving anything.
     */
    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', Rule::in(array_column($this->providers->all(), 'id'))],
            'model' => ['nullable', 'string', 'max:120'],
            'prompt' => ['nullable', 'string', 'max:2000'],
        ]);

        $started = hrtime(true);

        try {
            $result = $this->providers->make($validated['provider'], $validated['model'] ?? null)->extract(
                $validated['prompt'] ?? self::SAMPLE_PROMPT,
                [
                    'today' => today()->toDateString(),
                    'currency' => 'USD',
                    'payment_terms_days' => 30,
                    'clients' => [['id' => 1, 'name' => 'Jane Doe', 'company' => 'Acme Corp', 'email' => 'jane@acme.test']],
                ],
            );
        } catch (AiUnavailableException $e) {
            return response()->json([
                'success' => false,
                'reason' => $e->reason,
                'message' => $e->getMessage(),
                'duration_ms' => (int) ((hrtime(true) - $started) / 1_000_000),
            ], 503);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'provider' => $result->provider,
                'model' => $result->model,
                'input_tokens' => $result->inputTokens,
                'output_tokens' => $result->outputTokens,
                'duration_ms' => (int) ((hrtime(true) - $started) / 1_000_000),
                'output' => $result->data,
            ],
        ]);
    }
}
