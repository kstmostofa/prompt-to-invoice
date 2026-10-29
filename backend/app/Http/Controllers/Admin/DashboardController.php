<?php

namespace App\Http\Controllers\Admin;

use App\Enums\WorkspaceStatus;
use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $since = now()->startOfMonth()->subMonths(5);

        $signups = Workspace::query()
            ->where('created_at', '>=', $since)
            ->selectRaw("to_char(created_at, 'YYYY-MM') as month, COUNT(*) as count")
            ->groupByRaw("to_char(created_at, 'YYYY-MM')")
            ->pluck('count', 'month');

        // Six months, oldest first, empty months included.
        $series = collect(range(0, 5))->map(function (int $offset) use ($since, $signups): array {
            $month = $since->addMonths($offset)->format('Y-m');

            return ['month' => $month, 'count' => (int) ($signups[$month] ?? 0)];
        });

        return response()->json([
            'data' => [
                'workspaces' => Workspace::query()->count(),
                'active_workspaces' => Workspace::query()->where('status', WorkspaceStatus::Active)->count(),
                'suspended_workspaces' => Workspace::query()->where('status', WorkspaceStatus::Suspended)->count(),
                'users' => User::query()->where('is_admin', false)->count(),
                'signups' => $series,
                'plans' => Plan::query()->withCount('workspaces')->orderBy('sort_order')->get(['id', 'name', 'slug'])
                    ->map(fn (Plan $plan) => ['name' => $plan->name, 'slug' => $plan->slug, 'count' => $plan->workspaces_count]),
            ],
        ]);
    }
}
