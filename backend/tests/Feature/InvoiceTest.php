<?php

use App\Enums\WorkspaceRole;
use App\Models\BusinessProfile;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Plan;
use App\Models\Workspace;
use Database\Seeders\PlanSeeder;

beforeEach(function () {
    $this->seed(PlanSeeder::class);
    [$this->user, $this->workspace] = signInWithWorkspace();
    $this->profile = BusinessProfile::factory()->for($this->workspace)->create([
        'name' => 'Studio LLC',
        'currency' => 'USD',
        'invoice_prefix' => 'ST-',
        'next_invoice_number' => 7,
        'payment_terms_days' => 14,
        'default_tax_rate' => 10,
    ]);
    $this->client = Client::factory()->for($this->workspace)->create(['name' => 'Jane Doe', 'company' => 'Acme Corp']);
});

function invoicePayload(array $overrides = []): array
{
    return [
        'client_id' => test()->client->id,
        'issue_date' => '2026-10-01',
        'due_date' => '2026-10-31',
        'currency' => 'USD',
        'tax_rate' => 10,
        'items' => [
            ['description' => 'Consulting', 'quantity' => 10, 'unit' => 'h', 'unit_price' => 120],
            ['description' => 'Travel', 'quantity' => 1, 'unit_price' => 85.5],
        ],
        ...$overrides,
    ];
}

it('creates an invoice with server-calculated totals, a number and snapshots', function () {
    $response = $this->postJson('/v1/invoices', invoicePayload([
        // Totals sent by a client are ignored.
        'total' => 1,
    ]))->assertCreated();

    $response->assertJsonPath('data.number', 'ST-0007')
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.subtotal', '1285.50')
        ->assertJsonPath('data.tax_total', '128.55')
        ->assertJsonPath('data.total', '1414.05')
        ->assertJsonPath('data.items.0.amount', '1200.00')
        ->assertJsonPath('data.from.name', 'Studio LLC')
        ->assertJsonPath('data.to.company', 'Acme Corp');

    expect($this->profile->fresh()->next_invoice_number)->toBe(8);
});

it('numbers invoices in sequence and skips numbers already taken', function () {
    Invoice::factory()->for($this->workspace)->create(['number' => 'ST-0008', 'client_id' => $this->client->id]);

    $first = $this->postJson('/v1/invoices', invoicePayload())->json('data.number');
    $second = $this->postJson('/v1/invoices', invoicePayload())->json('data.number');

    expect([$first, $second])->toBe(['ST-0007', 'ST-0009']);
});

it('validates the invoice', function () {
    $this->postJson('/v1/invoices', [
        'issue_date' => '2026-10-10',
        'due_date' => '2026-10-01',
        'currency' => 'GBP',
        'tax_rate' => 120,
        'discount_type' => 'percent',
        'discount_value' => 150,
        'items' => [['description' => '', 'quantity' => 0, 'unit_price' => -1]],
    ])->assertUnprocessable()->assertJsonValidationErrors([
        'client_id', 'due_date', 'currency', 'tax_rate', 'discount_value',
        'items.0.description', 'items.0.quantity', 'items.0.unit_price',
    ]);
});

it('refuses a client from another workspace', function () {
    $foreign = Client::factory()->create();

    $this->postJson('/v1/invoices', invoicePayload(['client_id' => $foreign->id]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('client_id');
});

it('keeps invoices to their workspace', function () {
    $foreign = Invoice::factory()->create();

    $this->getJson("/v1/invoices/{$foreign->id}")->assertNotFound();
    $this->getJson("/v1/invoices/{$foreign->id}/pdf")->assertNotFound();
    $this->postJson("/v1/invoices/{$foreign->id}/mark-paid")->assertNotFound();
    $this->getJson('/v1/invoices')->assertOk()->assertJsonCount(0, 'data');
});

it('updates a draft, replacing its lines and recalculating', function () {
    $id = $this->postJson('/v1/invoices', invoicePayload())->json('data.id');

    $this->putJson("/v1/invoices/{$id}", invoicePayload([
        'discount_type' => 'amount',
        'discount_value' => 100,
        'items' => [['description' => 'Design', 'quantity' => 2, 'unit_price' => 500]],
    ]))->assertOk()
        ->assertJsonCount(1, 'data.items')
        ->assertJsonPath('data.discount_total', '100.00')
        ->assertJsonPath('data.tax_total', '90.00')
        ->assertJsonPath('data.total', '990.00');
});

it('keeps the sent details when a sent invoice is edited', function () {
    $id = $this->postJson('/v1/invoices', invoicePayload())->json('data.id');
    $this->postJson("/v1/invoices/{$id}/send")->assertOk();

    $this->client->update(['company' => 'Acme Renamed']);
    $this->profile->update(['name' => 'Studio Renamed']);

    $this->putJson("/v1/invoices/{$id}", invoicePayload())
        ->assertOk()
        ->assertJsonPath('data.to.company', 'Acme Corp')
        ->assertJsonPath('data.from.name', 'Studio LLC');
});

it('moves through sent, paid, unpaid and void, and refuses the rest', function () {
    $id = $this->postJson('/v1/invoices', invoicePayload())->json('data.id');

    $this->postJson("/v1/invoices/{$id}/send")->assertOk()->assertJsonPath('data.status', 'sent');
    $this->postJson("/v1/invoices/{$id}/mark-paid", ['paid_at' => '2026-10-15'])->assertOk()->assertJsonPath('data.status', 'paid');
    $this->putJson("/v1/invoices/{$id}", invoicePayload())->assertUnprocessable()->assertJsonValidationErrors('status');
    $this->postJson("/v1/invoices/{$id}/void")->assertUnprocessable();
    $this->postJson("/v1/invoices/{$id}/mark-unpaid")->assertOk()->assertJsonPath('data.status', 'sent')->assertJsonPath('data.paid_at', null);
    $this->postJson("/v1/invoices/{$id}/void")->assertOk()->assertJsonPath('data.status', 'void');
    $this->postJson("/v1/invoices/{$id}/send")->assertUnprocessable();
});

it('shows a sent invoice past its due date as overdue and filters by it', function () {
    Invoice::factory()->for($this->workspace)->overdue()->create(['client_id' => $this->client->id]);
    Invoice::factory()->for($this->workspace)->sent()->create(['client_id' => $this->client->id]);
    Invoice::factory()->for($this->workspace)->paid()->create(['client_id' => $this->client->id]);

    $this->getJson('/v1/invoices?status=overdue')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.display_status', 'overdue');
    $this->getJson('/v1/invoices?status=sent')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.display_status', 'sent');
    $this->getJson('/v1/invoices?status=sent,overdue')->assertOk()->assertJsonCount(2, 'data');
});

it('searches by number and client', function () {
    $this->postJson('/v1/invoices', invoicePayload())->assertCreated();
    $other = Client::factory()->for($this->workspace)->create(['name' => 'Bob', 'company' => 'Globex']);
    $this->postJson('/v1/invoices', invoicePayload(['client_id' => $other->id]))->assertCreated();

    $this->getJson('/v1/invoices?search=globex')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.to.company', 'Globex');
    $this->getJson('/v1/invoices?search=ST-0007')->assertOk()->assertJsonCount(1, 'data');
});

it('deletes drafts only', function () {
    $draft = $this->postJson('/v1/invoices', invoicePayload())->json('data.id');
    $sent = $this->postJson('/v1/invoices', invoicePayload())->json('data.id');
    $this->postJson("/v1/invoices/{$sent}/send");

    $this->deleteJson("/v1/invoices/{$draft}")->assertOk();
    $this->deleteJson("/v1/invoices/{$sent}")->assertUnprocessable();
});

it('duplicates an invoice as a new draft dated today', function () {
    $id = $this->postJson('/v1/invoices', invoicePayload())->json('data.id');
    $this->postJson("/v1/invoices/{$id}/mark-paid");

    $this->postJson("/v1/invoices/{$id}/duplicate")
        ->assertCreated()
        ->assertJsonPath('data.status', 'draft')
        ->assertJsonPath('data.number', 'ST-0008')
        ->assertJsonPath('data.issue_date', today()->toDateString())
        ->assertJsonPath('data.due_date', today()->addDays(30)->toDateString())
        ->assertJsonPath('data.total', '1414.05')
        ->assertJsonCount(2, 'data.items');
});

it('enforces the starter plan monthly limit, counting deleted drafts', function () {
    $this->workspace->update(['plan_id' => Plan::query()->where('slug', 'starter')->value('id')]);

    foreach (range(1, 5) as $n) {
        $id = $this->postJson('/v1/invoices', invoicePayload())->assertCreated()->json('data.id');
    }
    $this->deleteJson("/v1/invoices/{$id}")->assertOk();

    $this->postJson('/v1/invoices', invoicePayload())->assertUnprocessable()->assertJsonValidationErrors('plan');
    $this->getJson('/v1/invoices/defaults')->assertOk()->assertJsonPath('data.usage', ['used' => 5, 'limit' => 5]);
});

it('does not limit paid plans', function () {
    $this->workspace->update(['plan_id' => Plan::query()->where('slug', 'professional')->value('id')]);

    foreach (range(1, 6) as $n) {
        $this->postJson('/v1/invoices', invoicePayload())->assertCreated();
    }
});

it('serves editor defaults from the business profile', function () {
    $this->getJson('/v1/invoices/defaults')
        ->assertOk()
        ->assertJsonPath('data.currency', 'USD')
        ->assertJsonPath('data.tax_rate', '10.00')
        ->assertJsonPath('data.next_number', 'ST-0007')
        ->assertJsonPath('data.due_date', today()->addDays(14)->toDateString());
});

it('downloads a PDF', function () {
    $id = $this->postJson('/v1/invoices', invoicePayload(['reverse_charge' => true, 'notes' => "Thanks!\nSee you soon."]))->json('data.id');

    $response = $this->get("/v1/invoices/{$id}/pdf")->assertOk();

    expect($response->headers->get('content-type'))->toBe('application/pdf')
        ->and($response->headers->get('content-disposition'))->toContain('Invoice ST-0007.pdf')
        ->and(substr((string) $response->getContent(), 0, 4))->toBe('%PDF');
});

it('lets members create and manage invoices', function () {
    [, $workspace] = signInWithWorkspace(WorkspaceRole::Member);
    $client = Client::factory()->for($workspace)->create();

    $this->postJson('/v1/invoices', invoicePayload(['client_id' => $client->id]))->assertCreated();
});

it('sums the dashboard in the business currency only', function () {
    Invoice::factory()->for($this->workspace)->sent()->create(['client_id' => $this->client->id, 'total' => 100]);
    Invoice::factory()->for($this->workspace)->overdue()->create(['client_id' => $this->client->id, 'total' => 50]);
    Invoice::factory()->for($this->workspace)->paid()->create(['client_id' => $this->client->id, 'total' => 200]);
    Invoice::factory()->for($this->workspace)->sent()->create(['client_id' => $this->client->id, 'total' => 999, 'currency' => 'EUR']);
    Invoice::factory()->for(Workspace::factory())->sent()->create(['total' => 5000]);

    $this->getJson('/v1/dashboard')
        ->assertOk()
        ->assertJsonPath('data.currency', 'USD')
        ->assertJsonPath('data.outstanding', '150.00')
        ->assertJsonPath('data.overdue', '50.00')
        ->assertJsonPath('data.overdue_count', 1)
        ->assertJsonPath('data.paid_this_month', '200.00')
        ->assertJsonCount(6, 'data.monthly');
});
