<?php

use App\Models\BusinessProfile;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Notification;

beforeEach(fn () => $this->seed(PlanSeeder::class));

it('registers a user with a workspace on the starter plan and a default business profile', function () {
    $response = $this->postJson('/v1/auth/register', [
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
        'workspace_name' => 'Analytical Studio',
        'currency' => 'EUR',
    ]);

    $response->assertCreated()
        ->assertJsonPath('success', true)
        ->assertJsonStructure(['token', 'user' => ['id', 'workspaces']]);

    $user = User::query()->where('email', 'ada@example.com')->firstOrFail();
    $workspace = $user->currentWorkspace;

    expect($workspace->name)->toBe('Analytical Studio')
        ->and($workspace->plan->slug)->toBe('starter')
        ->and($user->roleIn($workspace)?->value)->toBe('owner');

    $profile = BusinessProfile::query()->where('workspace_id', $workspace->id)->sole();
    expect($profile->currency)->toBe('EUR')->and($profile->is_default)->toBeTrue();
});

it('rejects a duplicate email at registration', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/v1/auth/register', [
        'name' => 'Someone',
        'email' => 'taken@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
        'workspace_name' => 'Studio',
    ])->assertUnprocessable()->assertJsonValidationErrors('email');
});

it('logs in with the right password and returns a token', function () {
    $user = User::factory()->create(['email' => 'grace@example.com']);

    $this->postJson('/v1/auth/login', ['email' => 'grace@example.com', 'password' => 'password'])
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonStructure(['token']);

    expect($user->fresh()->last_login_at)->not->toBeNull();
});

it('refuses a wrong password', function () {
    User::factory()->create(['email' => 'grace@example.com']);

    $this->postJson('/v1/auth/login', ['email' => 'grace@example.com', 'password' => 'wrong'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

it('refuses a deactivated account only once the password is right', function () {
    User::factory()->inactive()->create(['email' => 'off@example.com']);

    $this->postJson('/v1/auth/login', ['email' => 'off@example.com', 'password' => 'password'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'This account has been deactivated. Contact support to restore it.');
});

it('answers 401 without a token, even without an Accept header', function () {
    $this->get('/v1/auth/user')->assertUnauthorized();
});

it('sends a reset link that points at the frontend', function () {
    Notification::fake();
    $user = User::factory()->create();

    $this->postJson('/v1/auth/forgot-password', ['email' => $user->email])->assertOk();

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user) {
        $url = $notification->toMail($user)->actionUrl;

        return str_starts_with($url, config('app.frontend_url').'/reset-password?token=');
    });
});

it('answers the same for an unknown address', function () {
    $this->postJson('/v1/auth/forgot-password', ['email' => 'nobody@example.com'])->assertOk();
});

it('changes the password when the current one is right', function () {
    [$user] = signInWithWorkspace();

    $this->putJson('/v1/auth/user/password', [
        'current_password' => 'password',
        'password' => 'new-secret-password',
        'password_confirmation' => 'new-secret-password',
    ])->assertOk();

    $this->putJson('/v1/auth/user/password', [
        'current_password' => 'not-it',
        'password' => 'x-secret-password',
        'password_confirmation' => 'x-secret-password',
    ])->assertUnprocessable()->assertJsonValidationErrors('current_password');
});

it('rate limits each auth endpoint on its own', function () {
    User::factory()->create(['email' => 'grace@example.com']);

    foreach (range(1, 10) as $attempt) {
        $this->postJson('/v1/auth/login', ['email' => 'grace@example.com', 'password' => 'wrong']);
    }
    $this->postJson('/v1/auth/login', ['email' => 'grace@example.com', 'password' => 'wrong'])->assertTooManyRequests();

    // Failed logins must not use up the sign-up allowance.
    $this->postJson('/v1/auth/register', [
        'name' => 'Ada',
        'email' => 'ada@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
        'workspace_name' => 'Studio',
    ])->assertCreated();
});
