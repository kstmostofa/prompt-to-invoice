<?php

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/*
|--------------------------------------------------------------------------
| Workspace helpers
|--------------------------------------------------------------------------
*/

/**
 * A workspace owned by a fresh user, signed in through Sanctum.
 *
 * @return array{0: User, 1: Workspace}
 */
function signInWithWorkspace(WorkspaceRole $role = WorkspaceRole::Owner): array
{
    $workspace = Workspace::factory()->create();
    $user = $workspace->owner;

    if ($role !== WorkspaceRole::Owner) {
        $user = User::factory()->create(['current_workspace_id' => $workspace->id]);
        $workspace->members()->attach($user->id, ['role' => $role->value]);
    }

    Sanctum::actingAs($user);

    return [$user->fresh(), $workspace];
}
