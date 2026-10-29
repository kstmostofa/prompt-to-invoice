<?php

use App\Models\User;
use App\Services\Ai\AiProviders;
use App\Services\Ai\AiRouter;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\DraftPrompt;
use App\Services\Ai\Drivers\GeminiExtractor;
use App\Services\Ai\Drivers\OpenAiCompatibleExtractor;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

function draftFields(): array
{
    return [
        'client' => ['match_id' => 1, 'name' => null, 'company' => null, 'email' => null],
        'currency' => 'USD', 'issue_date' => null, 'due_date' => null,
        'items' => [['description' => 'Consulting', 'quantity' => 10, 'unit' => 'h', 'unit_price' => 120]],
        'discount_type' => null, 'discount_value' => null, 'tax_rate' => null, 'notes' => null, 'warnings' => [],
    ];
}

function aiContext(): array
{
    return ['today' => '2026-10-29', 'currency' => 'USD', 'payment_terms_days' => 30, 'clients' => [['id' => 1, 'name' => 'Jane', 'company' => 'Acme', 'email' => null]]];
}

function openAiReply(string $content, string $finish = 'stop'): array
{
    return [
        'model' => 'gpt-test',
        'choices' => [['message' => ['role' => 'assistant', 'content' => $content, 'refusal' => null], 'finish_reason' => $finish]],
        'usage' => ['prompt_tokens' => 800, 'completion_tokens' => 90],
    ];
}

it('calls an OpenAI-compatible API with a strict JSON schema', function () {
    Http::fake(['api.example.test/*' => Http::response(openAiReply(json_encode(draftFields())))]);

    $result = (new OpenAiCompatibleExtractor('openai', ['key' => 'sk-test', 'model' => 'gpt-test', 'base_url' => 'https://api.example.test/v1'], 10))
        ->extract('10 hours consulting', aiContext());

    expect($result->provider)->toBe('openai')
        ->and($result->model)->toBe('gpt-test')
        ->and($result->inputTokens)->toBe(800)
        ->and($result->data['items'][0]['unit_price'])->toBe(120);

    Http::assertSent(function (Request $request) {
        return $request->url() === 'https://api.example.test/v1/chat/completions'
            && $request->hasHeader('Authorization', 'Bearer sk-test')
            && $request['model'] === 'gpt-test'
            && $request['response_format']['type'] === 'json_schema'
            && $request['response_format']['json_schema']['strict'] === true
            && $request['response_format']['json_schema']['schema'] === DraftPrompt::SCHEMA
            && $request['messages'][0]['content'] === DraftPrompt::SYSTEM
            && str_contains($request['messages'][1]['content'], '<description>');
    });
});

it('uses plain JSON mode with the schema in the instructions when asked, and reads fenced JSON', function () {
    Http::fake(['*' => Http::response(openAiReply("```json\n".json_encode(draftFields())."\n```"))]);

    $result = (new OpenAiCompatibleExtractor('custom', ['key' => 'k', 'model' => 'deepseek-chat', 'base_url' => 'https://llm.test/v1', 'json_mode' => 'object'], 10))
        ->extract('10 hours consulting', aiContext());

    expect($result->data['currency'])->toBe('USD');
    Http::assertSent(fn (Request $request) => $request['response_format'] === ['type' => 'json_object']
        && str_contains($request['messages'][0]['content'], 'matching this JSON Schema'));
});

it('maps OpenAI-compatible failures to reasons', function (int $status, string $reason) {
    Http::fake(['*' => Http::response(['error' => ['message' => 'nope']], $status)]);

    expect(fn () => (new OpenAiCompatibleExtractor('openai', ['key' => 'k', 'model' => 'm', 'base_url' => 'https://x.test/v1'], 10))->extract('x', aiContext()))
        ->toThrow(fn (AiUnavailableException $e) => expect($e->reason)->toBe($reason));
})->with([
    'bad key' => [401, 'auth'],
    'rate limited' => [429, 'rate_limited'],
    'unknown model' => [404, 'bad_request'],
    'server error' => [500, 'unavailable'],
]);

it('treats an OpenAI refusal as refused', function () {
    Http::fake(['*' => Http::response([
        'model' => 'gpt-test',
        'choices' => [['message' => ['content' => null, 'refusal' => 'I cannot help'], 'finish_reason' => 'stop']],
    ])]);

    expect(fn () => (new OpenAiCompatibleExtractor('openai', ['key' => 'k', 'model' => 'm', 'base_url' => 'https://x.test/v1'], 10))->extract('x', aiContext()))
        ->toThrow(fn (AiUnavailableException $e) => expect($e->reason)->toBe('refused'));
});

it('calls Gemini generateContent with a JSON schema', function () {
    Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
        'candidates' => [['content' => ['parts' => [['text' => json_encode(draftFields())]]], 'finishReason' => 'STOP']],
        'usageMetadata' => ['promptTokenCount' => 700, 'candidatesTokenCount' => 80, 'thoughtsTokenCount' => 20],
        'modelVersion' => 'gemini-test-001',
    ])]);

    $result = (new GeminiExtractor('gemini', ['key' => 'g-key', 'model' => 'gemini-test', 'base_url' => 'https://generativelanguage.googleapis.com/v1beta'], 10))
        ->extract('10 hours consulting', aiContext());

    expect($result->provider)->toBe('gemini')
        ->and($result->model)->toBe('gemini-test-001')
        ->and($result->outputTokens)->toBe(100)
        ->and($result->data['items'][0]['quantity'])->toBe(10);

    Http::assertSent(fn (Request $request) => $request->url() === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent'
        && $request->hasHeader('x-goog-api-key', 'g-key')
        && $request['generationConfig']['responseMimeType'] === 'application/json'
        && $request['generationConfig']['responseJsonSchema'] === DraftPrompt::SCHEMA
        && $request['systemInstruction']['parts'][0]['text'] === DraftPrompt::SYSTEM);
});

it('treats a Gemini safety block as refused', function () {
    Http::fake(['*' => Http::response(['candidates' => [['content' => ['parts' => []], 'finishReason' => 'SAFETY']]])]);

    expect(fn () => (new GeminiExtractor('gemini', ['key' => 'k', 'model' => 'm'], 10))->extract('x', aiContext()))
        ->toThrow(fn (AiUnavailableException $e) => expect($e->reason)->toBe('refused'));
});

it('routes to the active provider and model chosen by the admin', function () {
    config(['ai.providers.openai.key' => 'sk', 'ai.providers.gemini.key' => 'g']);
    app(AiProviders::class)->save(['provider' => 'gemini', 'model' => 'gemini-chosen']);
    Http::fake(['generativelanguage.googleapis.com/*' => Http::response([
        'candidates' => [['content' => ['parts' => [['text' => json_encode(draftFields())]]], 'finishReason' => 'STOP']],
    ])]);

    $result = app(AiRouter::class)->extract('x', aiContext());

    expect($result->provider)->toBe('gemini');
    Http::assertSent(fn (Request $request) => str_contains($request->url(), '/models/gemini-chosen:generateContent'));
});

it('falls back when the active provider is down', function () {
    config(['ai.providers.openai.key' => 'sk', 'ai.providers.gemini.key' => 'g']);
    app(AiProviders::class)->save(['provider' => 'openai', 'fallback' => 'gemini']);

    Http::fake([
        'api.openai.com/*' => Http::response([], 503),
        'generativelanguage.googleapis.com/*' => Http::response([
            'candidates' => [['content' => ['parts' => [['text' => json_encode(draftFields())]]], 'finishReason' => 'STOP']],
        ]),
    ]);

    expect(app(AiRouter::class)->extract('x', aiContext())->provider)->toBe('gemini');
});

it('does not fall back when the active provider refuses', function () {
    config(['ai.providers.openai.key' => 'sk', 'ai.providers.gemini.key' => 'g']);
    app(AiProviders::class)->save(['provider' => 'openai', 'fallback' => 'gemini']);

    Http::fake([
        'api.openai.com/*' => Http::response(['choices' => [['message' => ['content' => null, 'refusal' => 'no'], 'finish_reason' => 'stop']]]),
        'generativelanguage.googleapis.com/*' => Http::response([], 500),
    ]);
    expect(fn () => app(AiRouter::class)->extract('x', aiContext()))
        ->toThrow(fn (AiUnavailableException $e) => expect($e->reason)->toBe('refused'));
});

it('falls back past a provider with no key', function () {
    config(['ai.providers.anthropic.key' => null, 'ai.providers.openai.key' => 'sk']);
    app(AiProviders::class)->save(['provider' => 'anthropic', 'fallback' => 'openai']);
    Http::fake(['api.openai.com/*' => Http::response(openAiReply(json_encode(draftFields())))]);

    expect(app(AiRouter::class)->extract('x', aiContext())->provider)->toBe('openai');
});

describe('admin AI settings', function () {
    beforeEach(function () {
        Sanctum::actingAs(User::factory()->admin()->create());
        config([
            'ai.providers.anthropic.key' => 'sk-ant',
            'ai.providers.openai.key' => 'sk-oai',
            'ai.providers.gemini.key' => null,
        ]);
    });

    it('lists providers with configured status and never the keys', function () {
        $response = $this->getJson('/v1/admin/ai')->assertOk();

        $providers = collect($response->json('data.providers'))->keyBy('id');
        expect($providers->keys()->all())->toContain('anthropic', 'openai', 'gemini', 'openrouter', 'custom')
            ->and($providers['openai']['configured'])->toBeTrue()
            ->and($providers['gemini']['configured'])->toBeFalse()
            ->and($response->getContent())->not->toContain('sk-oai');
    });

    it('saves the active provider, model and fallback', function () {
        $this->putJson('/v1/admin/ai', ['provider' => 'openai', 'model' => 'gpt-4o-mini', 'fallback' => 'anthropic'])
            ->assertOk()
            ->assertJsonPath('data.provider', 'openai')
            ->assertJsonPath('data.model', 'gpt-4o-mini');

        expect(app(AiProviders::class)->settings())->toMatchArray(['provider' => 'openai', 'fallback' => 'anthropic']);
    });

    it('refuses a provider without a key, an unknown one, or itself as fallback', function () {
        $this->putJson('/v1/admin/ai', ['provider' => 'gemini'])->assertUnprocessable()->assertJsonValidationErrors('provider');
        $this->putJson('/v1/admin/ai', ['provider' => 'nope'])->assertUnprocessable();
        $this->putJson('/v1/admin/ai', ['provider' => 'openai', 'fallback' => 'openai'])->assertUnprocessable()->assertJsonValidationErrors('fallback');
    });

    it('test-runs a provider without saving anything', function () {
        Http::fake(['api.openai.com/*' => Http::response(openAiReply(json_encode(draftFields())))]);

        $this->postJson('/v1/admin/ai/test', ['provider' => 'openai'])
            ->assertOk()
            ->assertJsonPath('data.provider', 'openai')
            ->assertJsonPath('data.output.items.0.description', 'Consulting');

        $this->postJson('/v1/admin/ai/test', ['provider' => 'gemini'])
            ->assertStatus(503)
            ->assertJsonPath('reason', 'not_configured');
    });

    it('is for platform admins only', function () {
        signInWithWorkspace();

        $this->getJson('/v1/admin/ai')->assertForbidden();
    });
});
