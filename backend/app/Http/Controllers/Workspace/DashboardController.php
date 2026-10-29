<?php

namespace App\Http\Controllers\Workspace;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ClientResource;
use App\Http\Resources\InvoiceResource;
use App\Models\BusinessProfile;
use App\Models\Client;
use App\Models\Invoice;
use App\Services\Invoices\InvoiceService;
use App\Support\CurrentWorkspace;
use Illuminate\Http\JsonResponse;

/**
 * Workspace overview, in the business profile's currency. Invoices in the
 * other currency are summed separately so the two are never added together.
 */
class DashboardController extends Controller
{
    public function __invoke(CurrentWorkspace $current, InvoiceService $invoices): JsonResponse
    {
        $workspace = $current->get()->load('plan');
        $currency = BusinessProfile::query()->where('is_default', true)->value('currency') ?? 'USD';
        $since = now()->startOfMonth()->subMonths(5);

        $sum = fn ($query) => (string) $query->sum('total');
        $inCurrency = fn () => Invoice::query()->where('currency', $currency);

        $monthly = Invoice::query()
            ->where('currency', $currency)
            ->whereIn('status', [InvoiceStatus::Sent, InvoiceStatus::Paid])
            ->whereDate('issue_date', '>=', $since)
            ->selectRaw("to_char(issue_date, 'YYYY-MM') as month")
            ->selectRaw('SUM(total) as invoiced')
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as paid")
            ->groupByRaw("to_char(issue_date, 'YYYY-MM')")
            ->get()
            ->keyBy('month');

        $series = collect(range(0, 5))->map(function (int $offset) use ($since, $monthly): array {
            $month = $since->addMonths($offset)->format('Y-m');

            return [
                'month' => $month,
                'invoiced' => (float) ($monthly[$month]->invoiced ?? 0),
                'paid' => (float) ($monthly[$month]->paid ?? 0),
            ];
        });

        return response()->json([
            'data' => [
                'currency' => $currency,
                'invoiced_this_month' => $sum($inCurrency()->whereIn('status', [InvoiceStatus::Sent, InvoiceStatus::Paid])->whereDate('issue_date', '>=', now()->startOfMonth())),
                'paid_this_month' => $sum($inCurrency()->where('status', InvoiceStatus::Paid)->where('paid_at', '>=', now()->startOfMonth())),
                'outstanding' => $sum($inCurrency()->where('status', InvoiceStatus::Sent)),
                'overdue' => $sum($inCurrency()->where('status', InvoiceStatus::Sent)->whereDate('due_date', '<', today())),
                'overdue_count' => Invoice::query()->where('status', InvoiceStatus::Sent)->whereDate('due_date', '<', today())->count(),
                'draft_count' => Invoice::query()->where('status', InvoiceStatus::Draft)->count(),
                'monthly' => $series,
                'usage' => $invoices->usage(),
                'clients_count' => Client::query()->count(),
                'clients_this_month' => Client::query()->where('created_at', '>=', now()->startOfMonth())->count(),
                'plan' => $workspace->plan?->only(['name', 'slug', 'monthly_invoice_limit']),
                'recent_invoices' => InvoiceResource::collection(Invoice::query()->with('client')->latest()->limit(6)->get()),
                'recent_clients' => ClientResource::collection(Client::query()->latest()->limit(5)->get()),
            ],
        ]);
    }
}
