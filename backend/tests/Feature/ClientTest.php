<?php

use App\Models\Client;

it('creates, shows, updates and deletes a client', function () {
    signInWithWorkspace();

    $id = $this->postJson('/v1/clients', [
        'name' => 'Jane Doe',
        'company' => 'Acme Corp',
        'email' => 'jane@acme.test',
        'country' => 'US',
        'currency' => 'USD',
    ])->assertCreated()->json('data.id');

    $this->getJson("/v1/clients/{$id}")->assertOk()->assertJsonPath('data.company', 'Acme Corp');

    $this->putJson("/v1/clients/{$id}", ['name' => 'Jane Smith', 'currency' => 'EUR'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Jane Smith')
        ->assertJsonPath('data.currency', 'EUR');

    $this->deleteJson("/v1/clients/{$id}")->assertOk();
    expect(Client::query()->withTrashed()->find($id)->trashed())->toBeTrue();
});

it('validates client input', function () {
    signInWithWorkspace();

    $this->postJson('/v1/clients', ['email' => 'not-an-email', 'currency' => 'GBP', 'country' => 'USA'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email', 'currency', 'country']);
});

it('searches, sorts and paginates clients', function () {
    [, $workspace] = signInWithWorkspace();
    Client::factory()->for($workspace)->create(['name' => 'Zed', 'company' => 'Zeta']);
    Client::factory()->for($workspace)->create(['name' => 'Amy', 'company' => 'Alpha']);
    Client::factory()->count(10)->for($workspace)->create(['company' => 'Other']);

    $this->getJson('/v1/clients?search=alpha')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Amy');
    $this->getJson('/v1/clients?sort_by=name&sort_order=asc&per_page=5')
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.total', 12)
        ->assertJsonPath('meta.last_page', 3);
});

it('ignores sort columns outside the allowlist', function () {
    [, $workspace] = signInWithWorkspace();
    Client::factory()->for($workspace)->create();

    $this->getJson('/v1/clients?sort_by=workspace_id;drop table clients')->assertOk();
});

it('lists client options for pickers', function () {
    [, $workspace] = signInWithWorkspace();
    Client::factory()->count(3)->for($workspace)->create();

    $this->getJson('/v1/clients/options')->assertOk()->assertJsonCount(3, 'data')->assertJsonStructure(['data' => [['id', 'name']]]);
});
