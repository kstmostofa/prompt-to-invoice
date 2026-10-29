<?php

namespace App\Http\Controllers\Workspace;

use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Support\CurrentWorkspace;
use Illuminate\Http\JsonResponse;

/**
 * Workspace overview. Invoice totals join this once invoices land (week 2).
 */
class DashboardController extends Controller
{
    public function __invoke(CurrentWorkspace $current): JsonResponse
    {
        $workspace = $current->get()->load('plan');

        return response()->json([
            'data' => [
                'clients_count' => Client::query()->count(),
                'clients_this_month' => Client::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'plan' => $workspace->plan?->only(['name', 'slug', 'monthly_invoice_limit']),
                'recent_clients' => ClientResource::collection(Client::query()->latest()->limit(5)->get()),
            ],
        ]);
    }
}
