<?php

use App\Enums\WorkspaceRole;
use App\Models\BusinessProfile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function validProfile(array $overrides = []): array
{
    return [
        'name' => 'Studio LLC',
        'email' => 'billing@studio.test',
        'country' => 'DE',
        'tax_id' => 'DE123456789',
        'currency' => 'EUR',
        'default_tax_rate' => 19,
        'payment_terms_days' => 14,
        'invoice_prefix' => 'ST-',
        'next_invoice_number' => 100,
        ...$overrides,
    ];
}

it('creates the default profile on first read', function () {
    [, $workspace] = signInWithWorkspace();

    $this->getJson('/v1/business-profile')->assertOk()->assertJsonPath('data.name', $workspace->name);
    expect(BusinessProfile::query()->where('workspace_id', $workspace->id)->count())->toBe(1);
});

it('updates the business profile', function () {
    signInWithWorkspace();

    $this->putJson('/v1/business-profile', validProfile())
        ->assertOk()
        ->assertJsonPath('data.currency', 'EUR')
        ->assertJsonPath('data.invoice_prefix', 'ST-')
        ->assertJsonPath('data.next_invoice_number', 100);
});

it('never edits another workspace profile', function () {
    [, $workspace] = signInWithWorkspace();
    $foreign = BusinessProfile::factory()->create(['name' => 'Foreign']);

    $this->putJson('/v1/business-profile', validProfile(['name' => 'Mine']))->assertOk();

    expect($foreign->fresh()->name)->toBe('Foreign')
        ->and(BusinessProfile::query()->withoutGlobalScopes()->where('workspace_id', $workspace->id)->sole()->name)->toBe('Mine');
});

it('keeps members from editing the profile but lets them read it', function () {
    signInWithWorkspace(WorkspaceRole::Member);

    $this->getJson('/v1/business-profile')->assertOk();
    $this->putJson('/v1/business-profile', validProfile())->assertForbidden();
});

it('uploads, replaces and removes the logo', function () {
    Storage::fake('public');
    [, $workspace] = signInWithWorkspace();

    $this->post('/v1/business-profile/logo', ['logo' => UploadedFile::fake()->image('a.png')], ['Accept' => 'application/json'])->assertOk();
    $first = BusinessProfile::query()->withoutGlobalScopes()->where('workspace_id', $workspace->id)->sole()->logo_path;
    Storage::disk('public')->assertExists($first);

    $this->post('/v1/business-profile/logo', ['logo' => UploadedFile::fake()->image('b.png')], ['Accept' => 'application/json'])->assertOk();
    Storage::disk('public')->assertMissing($first);

    $this->deleteJson('/v1/business-profile/logo')->assertOk()->assertJsonPath('data.logo_url', null);
});

it('rejects a non-image logo', function () {
    Storage::fake('public');
    signInWithWorkspace();

    $this->post('/v1/business-profile/logo', ['logo' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('logo');
});
