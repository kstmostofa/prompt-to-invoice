<?php

use App\Enums\WorkspaceRole;
use App\Models\Plan;
use App\Models\User;
use Database\Seeders\PlanSeeder;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    config(['cashier.webhook.secret' => null, 'services.stripe.prices.professional' => 'price_pro']);
    $this->seed(PlanSeeder::class);
    [$this->user, $this->workspace] = signInWithWorkspace();
    $this->workspace->forceFill(['plan_id' => Plan::free()->id, 'stripe_id' => 'cus_test'])->save();
});

/**
 * A Stripe subscription webhook, shaped like the real event.
 */
function stripeSubscriptionEvent(string $type, array $overrides = []): array
{
    return [
        'id' => 'evt_test',
        'type' => $type,
        'data' => ['object' => [
            'id' => 'sub_test',
            'object' => 'subscription',
            'customer' => 'cus_test',
            'status' => 'active',
            'cancel_at_period_end' => false,
            'cancel_at' => null,
            'canceled_at' => null,
            'trial_end' => null,
            'metadata' => ['type' => 'default'],
            'items' => ['data' => [[
                'id' => 'si_test',
                'quantity' => 1,
                'price' => ['id' => 'price_pro', 'product' => 'prod_test'],
            ]]],
            ...$overrides,
        ]],
    ];
}

function planSlug(): string
{
    return test()->workspace->fresh()->plan->slug;
}

test('a new subscription moves the workspace onto the paid plan', function () {
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.created'))->assertOk();

    expect(planSlug())->toBe('professional');

    $this->getJson('/v1/billing')
        ->assertOk()
        ->assertJsonPath('data.plan.slug', 'professional')
        ->assertJsonPath('data.subscription.active', true)
        ->assertJsonPath('data.subscription.cancelled', false)
        ->assertJsonPath('data.has_billing_account', true);
});

test('a subscription cancelled at period end keeps the plan until it ends', function () {
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.created'));
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.updated', [
        'cancel_at' => now()->addDays(10)->timestamp,
    ]))->assertOk();

    expect(planSlug())->toBe('professional');
    $this->getJson('/v1/billing')
        ->assertJsonPath('data.subscription.active', true)
        ->assertJsonPath('data.subscription.cancelled', true);
});

test('a failed renewal keeps the plan while Stripe retries', function () {
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.created'));
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.updated', ['status' => 'past_due']));

    expect(planSlug())->toBe('professional');
    $this->getJson('/v1/billing')->assertJsonPath('data.subscription.past_due', true);
});

test('an ended subscription returns the workspace to the free plan', function () {
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.created'));
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.deleted', ['status' => 'canceled']))->assertOk();

    expect(planSlug())->toBe('starter');
    $this->getJson('/v1/billing')->assertJsonPath('data.subscription.active', false);
});

test('a plan assigned by an admin is not downgraded by Stripe', function () {
    $this->workspace->update(['plan_id' => Plan::query()->where('slug', 'enterprise')->value('id')]);

    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.deleted', ['status' => 'canceled']));

    expect(planSlug())->toBe('enterprise');
});

test('a subscription to an unknown price leaves the plan alone', function () {
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.created', [
        'items' => ['data' => [['id' => 'si_x', 'quantity' => 1, 'price' => ['id' => 'price_unknown', 'product' => 'prod_x']]]],
    ]));

    expect(planSlug())->toBe('starter');
});

test('webhooks for another customer do not touch the workspace', function () {
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.created', ['customer' => 'cus_other']))->assertOk();

    expect(planSlug())->toBe('starter');
});

test('the billing page lists the plans and only paid self-serve plans are purchasable', function () {
    $this->getJson('/v1/billing')
        ->assertOk()
        ->assertJsonPath('data.plan.slug', 'starter')
        ->assertJsonPath('data.subscription', null)
        ->assertJsonPath('data.usage.limit', 5)
        ->assertJsonCount(4, 'data.plans')
        ->assertJsonPath('data.plans.0.is_purchasable', false)
        ->assertJsonPath('data.plans.1.is_purchasable', true)
        ->assertJsonMissingPath('data.plans.1.stripe_price_id');
});

test('members cannot see or change billing', function () {
    signInWithWorkspace(WorkspaceRole::Member);

    $this->getJson('/v1/billing')->assertForbidden();
    $this->postJson('/v1/billing/checkout', ['plan' => 'professional'])->assertForbidden();
    $this->postJson('/v1/billing/portal')->assertForbidden();
});

test('checkout is unavailable until Stripe is configured', function () {
    config(['cashier.secret' => null]);

    $this->postJson('/v1/billing/checkout', ['plan' => 'professional'])->assertStatus(503);
});

test('checkout refuses plans that cannot be bought online', function (string $slug) {
    config(['cashier.secret' => 'sk_test_x']);

    $this->postJson('/v1/billing/checkout', ['plan' => $slug])->assertUnprocessable()->assertJsonValidationErrors('plan');
})->with(['starter', 'enterprise', 'missing']);

test('checkout refuses a second subscription', function () {
    config(['cashier.secret' => 'sk_test_x']);
    $this->postJson('/stripe/webhook', stripeSubscriptionEvent('customer.subscription.created'));

    $this->postJson('/v1/billing/checkout', ['plan' => 'professional'])->assertUnprocessable()->assertJsonValidationErrors('plan');
});

test('the portal needs a billing account', function () {
    config(['cashier.secret' => 'sk_test_x']);
    $this->workspace->forceFill(['stripe_id' => null])->save();

    $this->postJson('/v1/billing/portal')->assertUnprocessable()->assertJsonValidationErrors('billing');
});

test('admins can set a plan price and it stays admin-only', function () {
    $admin = User::factory()->create(['is_admin' => true]);
    Sanctum::actingAs($admin);
    $business = Plan::query()->where('slug', 'business')->sole();

    $this->putJson("/v1/admin/plans/{$business->id}", [
        ...$business->only(['name', 'slug', 'description', 'monthly_price', 'has_ai_generation', 'is_active', 'sort_order']),
        'stripe_price_id' => 'price_biz',
    ])->assertOk();

    expect($business->fresh()->stripe_price_id)->toBe('price_biz');
    $this->getJson('/v1/admin/plans')->assertJsonPath('data.2.stripe_price_id', 'price_biz');
    $this->putJson("/v1/admin/plans/{$business->id}", [...$business->only(['name', 'slug']), 'stripe_price_id' => 'not-a-price'])
        ->assertJsonValidationErrors('stripe_price_id');
});
