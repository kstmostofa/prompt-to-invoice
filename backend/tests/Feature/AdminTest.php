<?php

use App\Models\Client;
use App\Models\Plan;
use App\Models\User;
use App\Models\Workspace;
use Database\Seeders\PlanSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->seed(PlanSeeder::class);
    $this->admin = User::factory()->admin()->create();
});

it('keeps non-admins out of the admin API', function () {
    signInWithWorkspace();

    $this->getJson('/v1/admin/workspaces')->assertForbidden();
});

it('lists workspaces across the platform with filters', function () {
    Sanctum::actingAs($this->admin);
    Workspace::factory()->count(2)->create();
    Workspace::factory()->suspended()->create(['name' => 'Frozen Co']);

    $this->getJson('/v1/admin/workspaces')->assertOk()->assertJsonCount(3, 'data');
    $this->getJson('/v1/admin/workspaces?status=suspended')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Frozen Co');
});

it('shows a workspace with members and counts', function () {
    Sanctum::actingAs($this->admin);
    $workspace = Workspace::factory()->create();
    Client::factory()->count(4)->for($workspace)->create();

    $this->getJson("/v1/admin/workspaces/{$workspace->id}")
        ->assertOk()
        ->assertJsonPath('data.clients_count', 4)
        ->assertJsonPath('data.members.0.role', 'owner');
});

it('suspends and reactivates a workspace', function () {
    Sanctum::actingAs($this->admin);
    $workspace = Workspace::factory()->create();

    $this->postJson("/v1/admin/workspaces/{$workspace->id}/suspend")->assertOk()->assertJsonPath('data.status', 'suspended');
    $this->postJson("/v1/admin/workspaces/{$workspace->id}/activate")->assertOk()->assertJsonPath('data.status', 'active');
});

it('changes a workspace plan', function () {
    Sanctum::actingAs($this->admin);
    $workspace = Workspace::factory()->create();
    $business = Plan::query()->where('slug', 'business')->sole();

    $this->putJson("/v1/admin/workspaces/{$workspace->id}/plan", ['plan_id' => $business->id])
        ->assertOk()
        ->assertJsonPath('data.plan.slug', 'business');
});

it('deactivates a user and revokes their tokens, but not the admin themself', function () {
    Sanctum::actingAs($this->admin);
    $user = User::factory()->create();
    $user->createToken('t');

    $this->postJson("/v1/admin/users/{$user->id}/deactivate")->assertOk()->assertJsonPath('data.is_active', false);
    expect($user->tokens()->count())->toBe(0);

    $this->postJson("/v1/admin/users/{$this->admin->id}/deactivate")->assertUnprocessable();
});

it('manages plans and refuses to delete one in use', function () {
    Sanctum::actingAs($this->admin);

    $id = $this->postJson('/v1/admin/plans', [
        'name' => 'Agency',
        'slug' => 'agency',
        'monthly_price' => 79,
        'features' => ['Everything'],
        'is_active' => true,
        'sort_order' => 5,
    ])->assertCreated()->json('data.id');

    $this->putJson("/v1/admin/plans/{$id}", ['name' => 'Agency Plus', 'slug' => 'agency'])->assertOk()->assertJsonPath('data.name', 'Agency Plus');
    $this->deleteJson("/v1/admin/plans/{$id}")->assertOk();

    $starter = Plan::query()->where('slug', 'starter')->sole();
    Workspace::factory()->create(['plan_id' => $starter->id]);
    $this->deleteJson("/v1/admin/plans/{$starter->id}")->assertUnprocessable();
});

it('summarises the platform on the admin dashboard', function () {
    Sanctum::actingAs($this->admin);
    Workspace::factory()->count(2)->create();

    $this->getJson('/v1/admin/dashboard')
        ->assertOk()
        ->assertJsonPath('data.workspaces', 2)
        ->assertJsonCount(6, 'data.signups')
        ->assertJsonPath('data.signups.5', ['month' => now()->format('Y-m'), 'count' => 2]);
});

it('serves the public plan catalogue', function () {
    $this->getJson('/v1/plans')->assertOk()->assertJsonCount(4, 'data')->assertJsonPath('data.0.slug', 'starter');
});
