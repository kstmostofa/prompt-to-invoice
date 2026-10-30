<?php

namespace App\Listeners;

use App\Models\Workspace;
use App\Services\BillingService;
use Laravel\Cashier\Events\WebhookHandled;

/**
 * After Cashier has stored a subscription change from Stripe, move the
 * workspace onto the matching plan.
 */
class SyncWorkspacePlan
{
    private const EVENTS = [
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'customer.deleted',
    ];

    public function __construct(private BillingService $billing) {}

    public function handle(WebhookHandled $event): void
    {
        if (! in_array($event->payload['type'] ?? null, self::EVENTS, true)) {
            return;
        }

        $object = $event->payload['data']['object'] ?? [];
        $customerId = $event->payload['type'] === 'customer.deleted' ? ($object['id'] ?? null) : ($object['customer'] ?? null);
        $workspace = $customerId ? Workspace::query()->where('stripe_id', $customerId)->first() : null;

        if ($workspace !== null) {
            $this->billing->syncPlan($workspace);
        }
    }
}
