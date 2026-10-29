<?php

use App\Enums\WorkspaceRole;
use App\Models\Client;
use App\Models\User;
use App\Models\Workspace;
use Laravel\Sanctum\Sanctum;

it('lists only the current workspace clients', function () {
    [, $workspace] = signInWithWorkspace();
    Client::factory()->count(3)->for($workspace)->create();
    Client::factory()->count(2)->create();

    $this->getJson('/v1/clients')->assertOk()->assertJsonCount(3, 'data');
});

it('answers 404 for another workspace client by id, for every verb', function () {
    signInWithWorkspace();
    $foreign = Client::factory()->create();

    $this->getJson("/v1/clients/{$foreign->id}")->assertNotFound();
    $this->putJson("/v1/clients/{$foreign->id}", ['name' => 'Hijacked'])->assertNotFound();
    $this->deleteJson("/v1/clients/{$foreign->id}")->assertNotFound();

    expect($foreign->fresh()->name)->not->toBe('Hijacked')->and($foreign->fresh()->trashed())->toBeFalse();
});

it('stamps new rows with the current workspace, ignoring a workspace_id in the payload', function () {
    [, $workspace] = signInWithWorkspace();
    $other = Workspace::factory()->create();

    $this->postJson('/v1/clients', ['name' => 'Acme Corp', 'workspace_id' => $other->id])->assertCreated();

    expect(Client::query()->withoutGlobalScopes()->where('name', 'Acme Corp')->sole()->workspace_id)->toBe($workspace->id);
});

it('acts in the workspace named by X-Workspace when the user is a member', function () {
    [$user, $first] = signInWithWorkspace();
    $second = Workspace::factory()->create();
    $second->members()->attach($user->id, ['role' => WorkspaceRole::Member->value]);
    Client::factory()->for($first)->create();
    Client::factory()->count(2)->for($second)->create();

    $this->getJson('/v1/clients', ['X-Workspace' => (string) $second->id])->assertOk()->assertJsonCount(2, 'data');
});

it('refuses a workspace the user is not a member of', function () {
    signInWithWorkspace();
    $stranger = Workspace::factory()->create();

    $this->getJson('/v1/clients', ['X-Workspace' => (string) $stranger->id])
        ->assertForbidden()
        ->assertJsonPath('code', 'no_workspace');
});

it('blocks a suspended workspace', function () {
    $workspace = Workspace::factory()->suspended()->create();
    Sanctum::actingAs($workspace->owner->fresh());

    $this->getJson('/v1/clients')->assertForbidden()->assertJsonPath('code', 'workspace_suspended');
});

it('switches the current workspace only to one the user belongs to', function () {
    [$user] = signInWithWorkspace();
    $mine = Workspace::factory()->create();
    $mine->members()->attach($user->id, ['role' => WorkspaceRole::Admin->value]);
    $stranger = Workspace::factory()->create();

    $this->postJson("/v1/workspaces/{$mine->id}/switch")->assertOk();
    expect($user->fresh()->current_workspace_id)->toBe($mine->id);

    $this->postJson("/v1/workspaces/{$stranger->id}/switch")->assertNotFound();
    expect($user->fresh()->current_workspace_id)->toBe($mine->id);
});

it('cuts off a deactivated user on their next request', function () {
    [$user] = signInWithWorkspace();
    $user->update(['is_active' => false]);
    Sanctum::actingAs($user);

    $this->getJson('/v1/clients')->assertUnauthorized()->assertJsonPath('code', 'deactivated');
});

it('returns the current workspace with the viewer role', function () {
    [, $workspace] = signInWithWorkspace(WorkspaceRole::Member);

    $this->getJson('/v1/workspace')
        ->assertOk()
        ->assertJsonPath('data.id', $workspace->id)
        ->assertJsonPath('data.role', 'member');
});

it('lets only owners and admins rename the workspace', function () {
    signInWithWorkspace(WorkspaceRole::Member);
    $this->putJson('/v1/workspace', ['name' => 'Renamed'])->assertForbidden();

    signInWithWorkspace(WorkspaceRole::Admin);
    $this->putJson('/v1/workspace', ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.name', 'Renamed');
});

it('keeps platform admins without a workspace out of workspace routes', function () {
    Sanctum::actingAs(User::factory()->admin()->create());

    $this->getJson('/v1/clients')->assertForbidden();
});
