<?php

use App\Models\User;
use Database\Seeders\PlanSeeder;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;

it('sends a verification link pointing at the frontend on sign-up', function () {
    Notification::fake();
    $this->seed(PlanSeeder::class);

    $this->postJson('/v1/auth/register', [
        'name' => 'Ada',
        'email' => 'ada@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
        'workspace_name' => 'Studio',
    ])->assertCreated();

    $user = User::query()->where('email', 'ada@example.com')->sole();
    expect($user->hasVerifiedEmail())->toBeFalse();

    Notification::assertSentTo($user, VerifyEmail::class, function (VerifyEmail $notification) use ($user) {
        $url = $notification->toMail($user)->actionUrl;

        return str_starts_with($url, config('app.frontend_url').'/verify-email?id='.$user->id) && str_contains($url, 'signature=');
    });
});

it('verifies with a signed link and refuses a tampered one', function () {
    $user = User::factory()->unverified()->create();
    $link = (new VerifyEmail)->toMail($user)->actionUrl;
    parse_str((string) parse_url($link, PHP_URL_QUERY), $query);
    $api = "/v1/auth/verify-email/{$query['id']}/{$query['hash']}?expires={$query['expires']}&signature={$query['signature']}";

    $this->getJson(str_replace($query['hash'], sha1('someone@else.test'), $api))->assertForbidden();
    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();

    $this->getJson($api)->assertOk();
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('resends the link only while unverified', function () {
    Notification::fake();
    $user = User::factory()->unverified()->create();
    Sanctum::actingAs($user);

    $this->postJson('/v1/auth/email/verification-notification')->assertOk();
    Notification::assertSentToTimes($user, VerifyEmail::class, 1);

    $user->markEmailAsVerified();
    $this->postJson('/v1/auth/email/verification-notification')->assertOk()->assertJsonPath('message', 'Your email is already verified.');
    Notification::assertSentToTimes($user, VerifyEmail::class, 1);
});
