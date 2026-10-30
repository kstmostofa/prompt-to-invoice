<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Workspace;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Laravel\Cashier\Subscription;

/**
 * Stripe subscriptions through Cashier. Checkout and the customer portal are
 * hosted by Stripe; webhooks keep workspaces.plan_id in step (syncPlan).
 */
class BillingService
{
    public const SUBSCRIPTION = 'default';

    public function isConfigured(): bool
    {
        return filled(config('cashier.secret'));
    }

    /**
     * @return array{status: string, active: bool, past_due: bool, cancelled: bool, ends_at: mixed}|null
     */
    public function subscriptionSummary(Workspace $workspace): ?array
    {
        $subscription = $workspace->subscription(self::SUBSCRIPTION);

        if (! $subscription instanceof Subscription) {
            return null;
        }

        return [
            'status' => $subscription->stripe_status,
            'active' => $subscription->valid(),
            'past_due' => $subscription->pastDue(),
            // Cancelled at period end: still active until ends_at.
            'cancelled' => $subscription->canceled(),
            'ends_at' => $subscription->ends_at,
        ];
    }

    /**
     * A Stripe Checkout page for the plan; Stripe sends the owner back to the
     * billing page either way.
     */
    public function checkoutUrl(Workspace $workspace, Plan $plan): string
    {
        $this->ensureConfigured();

        if (! $plan->isPurchasable()) {
            throw ValidationException::withMessages([
                'plan' => ["The {$plan->name} plan can't be bought online."],
            ]);
        }

        if ($workspace->subscribed(self::SUBSCRIPTION)) {
            throw ValidationException::withMessages([
                'plan' => ['You already have a subscription. Change or cancel it from "Manage subscription".'],
            ]);
        }

        return $workspace->newSubscription(self::SUBSCRIPTION, (string) $plan->stripe_price_id)
            ->allowPromotionCodes()
            ->checkout([
                'success_url' => $this->returnUrl('success'),
                'cancel_url' => $this->returnUrl('cancelled'),
                'client_reference_id' => (string) $workspace->id,
            ])
            ->asStripeCheckoutSession()
            ->url;
    }

    /**
     * Stripe's customer portal: card, invoices and receipts, plan change, cancel.
     */
    public function portalUrl(Workspace $workspace): string
    {
        $this->ensureConfigured();

        if (! $workspace->hasStripeId()) {
            throw ValidationException::withMessages([
                'billing' => ['There is no billing account yet. Upgrade to a paid plan first.'],
            ]);
        }

        return $workspace->billingPortalUrl($this->returnUrl());
    }

    /**
     * Put the workspace on the plan its subscription pays for. Without a
     * valid subscription it falls back to the free plan, but only from a
     * self-serve plan: a plan an admin assigned by hand (e.g. Enterprise) is
     * left alone.
     */
    public function syncPlan(Workspace $workspace): void
    {
        $workspace->loadMissing('plan');
        $subscription = $workspace->subscription(self::SUBSCRIPTION);

        if ($subscription?->valid()) {
            $plan = Plan::query()->where('stripe_price_id', $subscription->stripe_price)->first();

            if ($plan === null) {
                Log::warning('Stripe subscription price matches no plan', [
                    'workspace_id' => $workspace->id,
                    'stripe_price' => $subscription->stripe_price,
                ]);

                return;
            }
        } elseif ($workspace->plan?->stripe_price_id !== null) {
            $plan = Plan::free();
        } else {
            return;
        }

        if ($plan !== null && $workspace->plan_id !== $plan->id) {
            $workspace->plan()->associate($plan)->save();
        }
    }

    private function ensureConfigured(): void
    {
        abort_unless($this->isConfigured(), 503, 'Online billing is not set up yet.');
    }

    private function returnUrl(?string $checkout = null): string
    {
        $url = config('app.frontend_url').'/settings/billing';

        return $checkout === null ? $url : $url.'?checkout='.$checkout;
    }
}
