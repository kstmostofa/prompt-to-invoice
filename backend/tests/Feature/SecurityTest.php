<?php

use App\Models\BusinessProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('sends hardening headers on API responses', function () {
    $this->getJson('/v1/plans')
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'DENY')
        ->assertHeader('Referrer-Policy', 'no-referrer')
        ->assertHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
});

it('rejects SVG logos, which can carry scripts', function () {
    Storage::fake('public');
    signInWithWorkspace();

    $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

    $this->post('/v1/business-profile/logo', ['logo' => $svg], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('logo');
});

it('stores logos on the configured disk', function () {
    config(['filesystems.logo_disk' => 's3']);
    Storage::fake('s3');
    [, $workspace] = signInWithWorkspace();

    $this->post('/v1/business-profile/logo', ['logo' => UploadedFile::fake()->image('a.png')], ['Accept' => 'application/json'])->assertOk();

    $path = BusinessProfile::query()->withoutGlobalScopes()->where('workspace_id', $workspace->id)->sole()->logo_path;
    Storage::disk('s3')->assertExists($path);
});

it('expires API tokens', function () {
    $user = User::factory()->create();
    $token = $user->createToken('web');
    $token->accessToken->forceFill(['created_at' => now()->subMinutes(config('sanctum.expiration') + 1)])->save();

    $this->getJson('/v1/auth/user', ['Authorization' => "Bearer {$token->plainTextToken}"])->assertUnauthorized();
});

it('rate limits sign-in per visitor when the request comes through a trusted proxy', function () {
    config(['trustedproxy.proxies' => '127.0.0.1']);
    $attempt = fn (string $ip) => $this->postJson('/v1/auth/login', ['email' => 'nobody@example.com', 'password' => 'wrong'], ['X-Forwarded-For' => $ip]);

    foreach (range(1, 10) as $i) {
        $attempt('203.0.113.7');
    }

    $attempt('203.0.113.7')->assertTooManyRequests();
    $attempt('198.51.100.20')->assertUnprocessable();
});

it('ignores X-Forwarded-For from untrusted callers', function () {
    config(['trustedproxy.proxies' => null]);
    $attempt = fn (string $ip) => $this->postJson('/v1/auth/login', ['email' => 'nobody@example.com', 'password' => 'wrong'], ['X-Forwarded-For' => $ip]);

    foreach (range(1, 10) as $i) {
        $attempt('203.0.113.'.$i);
    }

    $attempt('198.51.100.20')->assertTooManyRequests();
});

it('creates the first platform admin from the command line', function () {
    $this->artisan('app:create-admin', ['email' => 'Owner@Example.com', '--name' => 'Ops'])
        ->expectsQuestion('Password', 'a-long-secure-password')
        ->assertSuccessful();

    $admin = User::query()->where('email', 'owner@example.com')->sole();
    expect($admin->is_admin)->toBeTrue()
        ->and($admin->email_verified_at)->not->toBeNull()
        ->and($admin->current_workspace_id)->toBeNull();
});

it('promotes an existing user to platform admin', function () {
    $user = User::factory()->create(['email' => 'grace@example.com', 'is_active' => false]);

    $this->artisan('app:create-admin', ['email' => 'grace@example.com'])->assertSuccessful();

    expect($user->fresh())->is_admin->toBeTrue()->is_active->toBeTrue();
});
