<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\CheckoutRequest;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use App\Services\BillingService;
use App\Services\Invoices\InvoiceService;
use App\Support\CurrentWorkspace;
use Illuminate\Http\JsonResponse;

class BillingController extends Controller
{
    public function __construct(private BillingService $billing, private CurrentWorkspace $current) {}

    public function show(InvoiceService $invoices): JsonResponse
    {
        $workspace = $this->current->get()->load('plan');

        return response()->json([
            'data' => [
                'enabled' => $this->billing->isConfigured(),
                'plan' => $workspace->plan ? new PlanResource($workspace->plan) : null,
                'subscription' => $this->billing->subscriptionSummary($workspace),
                'has_billing_account' => $workspace->hasStripeId(),
                'usage' => $invoices->usage(),
                'plans' => PlanResource::collection(Plan::query()->where('is_active', true)->orderBy('sort_order')->get()),
            ],
        ]);
    }

    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $plan = Plan::query()->where('slug', $request->validated('plan'))->firstOrFail();

        return response()->json(['data' => ['url' => $this->billing->checkoutUrl($this->current->get(), $plan)]]);
    }

    public function portal(): JsonResponse
    {
        return response()->json(['data' => ['url' => $this->billing->portalUrl($this->current->get())]]);
    }
}
