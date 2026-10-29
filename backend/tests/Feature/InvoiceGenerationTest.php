<?php

use App\Models\AiGeneration;
use App\Models\BusinessProfile;
use App\Models\Client;
use App\Models\Plan;
use App\Services\Ai\AiUnavailableException;
use App\Services\Ai\ClaudeInvoiceDraftExtractor;
use App\Services\Ai\ExtractedDraft;
use App\Services\Ai\InvoiceDraftExtractor;
use Database\Seeders\PlanSeeder;

/**
 * A stand-in for the model: returns canned fields and records what it was given.
 */
class FakeDraftExtractor implements InvoiceDraftExtractor
{
    public ?string $prompt = null;

    /** @var array<string, mixed>|null */
    public ?array $context = null;

    public function __construct(public array|AiUnavailableException $response) {}

    public function extract(string $prompt, array $context): ExtractedDraft
    {
        $this->prompt = $prompt;
        $this->context = $context;

        if ($this->response instanceof AiUnavailableException) {
            throw $this->response;
        }

        return new ExtractedDraft($this->response, 'claude-opus-5-5', 1200, 300);
    }
}

function modelSays(array|AiUnavailableException $response): FakeDraftExtractor
{
    $fake = new FakeDraftExtractor($response);
    app()->instance(InvoiceDraftExtractor::class, $fake);

    return $fake;
}

function modelFields(array $overrides = []): array
{
    return [
        'client' => ['match_id' => null, 'name' => null, 'company' => null, 'email' => null],
        'currency' => null,
        'issue_date' => null,
        'due_date' => null,
        'items' => [['description' => 'Consulting', 'quantity' => 10, 'unit' => 'h', 'unit_price' => 120]],
        'discount_type' => null,
        'discount_value' => null,
        'tax_rate' => null,
        'notes' => null,
        'warnings' => [],
        ...$overrides,
    ];
}

beforeEach(function () {
    $this->seed(PlanSeeder::class);
    [$this->user, $this->workspace] = signInWithWorkspace();
    $this->workspace->update(['plan_id' => Plan::query()->where('slug', 'professional')->value('id')]);
    BusinessProfile::factory()->for($this->workspace)->create(['currency' => 'EUR', 'payment_terms_days' => 14, 'default_tax_rate' => 19]);
    $this->acme = Client::factory()->for($this->workspace)->create(['name' => 'Jane Doe', 'company' => 'Acme Corp', 'currency' => 'USD']);
});

it('drafts an invoice for a matched client with server-side totals', function () {
    $fake = modelSays(modelFields([
        'client' => ['match_id' => $this->acme->id, 'name' => null, 'company' => null, 'email' => null],
        'due_date' => today()->addDays(30)->toDateString(),
        'tax_rate' => 0,
    ]));

    $this->postJson('/v1/invoices/generate', ['prompt' => '10 hours of consulting for Acme at $120/hour, due in 30 days'])
        ->assertOk()
        ->assertJsonPath('data.client_id', $this->acme->id)
        ->assertJsonPath('data.suggested_client', null)
        ->assertJsonPath('data.currency', 'USD')
        ->assertJsonPath('data.issue_date', today()->toDateString())
        ->assertJsonPath('data.due_date', today()->addDays(30)->toDateString())
        ->assertJsonPath('data.totals.total', '1200.00')
        ->assertJsonPath('data.source_prompt', '10 hours of consulting for Acme at $120/hour, due in 30 days');

    expect($fake->context['currency'])->toBe('EUR')
        ->and($fake->context['clients'][0])->toMatchArray(['id' => $this->acme->id, 'company' => 'Acme Corp']);
});

it('falls back to business defaults for what the description leaves out', function () {
    modelSays(modelFields());

    $this->postJson('/v1/invoices/generate', ['prompt' => '10 hours of consulting'])
        ->assertOk()
        ->assertJsonPath('data.currency', 'EUR')
        ->assertJsonPath('data.tax_rate', 19)
        ->assertJsonPath('data.due_date', today()->addDays(14)->toDateString())
        ->assertJsonPath('data.totals.total', '1428.00')
        ->assertJsonFragment(['No client was named. Choose who this invoice is for.']);
});

it('suggests a new client when none matches', function () {
    modelSays(modelFields(['client' => ['match_id' => null, 'name' => 'Bob Smith', 'company' => 'Globex', 'email' => 'bob@globex.test']]));

    $this->postJson('/v1/invoices/generate', ['prompt' => 'Logo design for Bob Smith at Globex, $500'])
        ->assertOk()
        ->assertJsonPath('data.client_id', null)
        ->assertJsonPath('data.suggested_client', ['name' => 'Bob Smith', 'company' => 'Globex', 'email' => 'bob@globex.test']);
});

it('never trusts a client id from another workspace', function () {
    $foreign = Client::factory()->create();
    modelSays(modelFields(['client' => ['match_id' => $foreign->id, 'name' => 'Someone', 'company' => null, 'email' => 'not-an-email']]));

    $this->postJson('/v1/invoices/generate', ['prompt' => 'Work for someone'])
        ->assertOk()
        ->assertJsonPath('data.client_id', null)
        ->assertJsonPath('data.suggested_client.email', null);
});

it('cleans up model output: bad lines dropped, numbers clamped, odd dates replaced', function () {
    modelSays(modelFields([
        'issue_date' => '2099-01-01',
        'due_date' => 'next week',
        'tax_rate' => 250,
        'discount_type' => 'percent',
        'discount_value' => 400,
        'items' => [
            ['description' => '  Design  ', 'quantity' => 2, 'unit' => null, 'unit_price' => -5],
            ['description' => '', 'quantity' => 1, 'unit' => null, 'unit_price' => 100],
            ['description' => 'Nothing', 'quantity' => 0, 'unit' => null, 'unit_price' => 100],
        ],
    ]));

    $this->postJson('/v1/invoices/generate', ['prompt' => 'Two design sessions'])
        ->assertOk()
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.items.0.description', 'Design')
        ->assertJsonPath('data.items.0.unit_price', 0)
        ->assertJsonPath('data.issue_date', today()->toDateString())
        ->assertJsonPath('data.tax_rate', 100)
        ->assertJsonPath('data.discount_value', 100);
});

it('refuses a description with no billable work', function () {
    modelSays(modelFields(['items' => []]));

    $this->postJson('/v1/invoices/generate', ['prompt' => 'hello there'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('prompt');
});

it('logs every request with its token usage', function () {
    modelSays(modelFields());
    $this->postJson('/v1/invoices/generate', ['prompt' => '10 hours of consulting'])->assertOk();

    modelSays(new AiUnavailableException('Busy', 'rate_limited'));
    $this->postJson('/v1/invoices/generate', ['prompt' => '10 hours of consulting'])
        ->assertStatus(503)
        ->assertJsonPath('code', 'ai_unavailable')
        ->assertJsonPath('message', 'Busy');

    $rows = AiGeneration::query()->orderBy('id')->get();
    expect($rows)->toHaveCount(2)
        ->and($rows[0]->status)->toBe('succeeded')
        ->and($rows[0]->input_tokens)->toBe(1200)
        ->and($rows[0]->workspace_id)->toBe($this->workspace->id)
        ->and($rows[1]->status)->toBe('failed')
        ->and($rows[1]->error)->toBe('rate_limited');
});

it('respects the plan switch for AI generation', function () {
    $this->workspace->plan->update(['has_ai_generation' => false]);
    modelSays(modelFields());

    $this->postJson('/v1/invoices/generate', ['prompt' => '10 hours of consulting'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('prompt');
});

it('validates the prompt', function () {
    $this->postJson('/v1/invoices/generate', ['prompt' => 'hi'])->assertUnprocessable()->assertJsonValidationErrors('prompt');
    $this->postJson('/v1/invoices/generate', ['prompt' => str_repeat('a', 2001)])->assertUnprocessable();
});

it('says so when no API key is configured', function () {
    $extractor = new ClaudeInvoiceDraftExtractor(apiKey: null, model: 'claude-opus-5-5', effort: 'low', timeout: 5);

    expect(fn () => $extractor->extract('10 hours', ['today' => '2026-10-29', 'currency' => 'USD', 'payment_terms_days' => 30, 'clients' => []]))
        ->toThrow(AiUnavailableException::class, 'not set up yet');
});

it('keeps the prompt on the invoice saved from a draft', function () {
    $id = $this->postJson('/v1/invoices', [
        'client_id' => $this->acme->id,
        'issue_date' => today()->toDateString(),
        'due_date' => today()->addDays(30)->toDateString(),
        'currency' => 'USD',
        'tax_rate' => 0,
        'source_prompt' => '10 hours of consulting for Acme',
        'items' => [['description' => 'Consulting', 'quantity' => 10, 'unit_price' => 120]],
    ])->assertCreated()->json('data.id');

    $this->getJson("/v1/invoices/{$id}")->assertJsonPath('data.source_prompt', '10 hours of consulting for Acme');
});
