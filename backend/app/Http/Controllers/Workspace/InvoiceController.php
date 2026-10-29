<?php

namespace App\Http\Controllers\Workspace;

use App\Enums\InvoiceStatus;
use App\Http\Controllers\Concerns\SortsQueries;
use App\Http\Controllers\Controller;
use App\Http\Requests\Workspace\EmailInvoiceRequest;
use App\Http\Requests\Workspace\InvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\Invoices\InvoicePdf;
use App\Services\Invoices\InvoiceService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class InvoiceController extends Controller
{
    use SortsQueries;

    public function __construct(private InvoiceService $invoices) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $search = $request->string('search')->trim();

        $invoices = Invoice::query()
            ->with('client')
            ->when($search->isNotEmpty(), fn (Builder $query) => $query->where(function (Builder $query) use ($search): void {
                $query->whereLike('number', "%{$search}%")
                    ->orWhereLike('to_details->name', "%{$search}%")
                    ->orWhereLike('to_details->company', "%{$search}%");
            }))
            ->when($request->filled('status'), fn (Builder $query) => $query->withDisplayStatus(explode(',', $request->string('status')->toString())))
            ->when($request->filled('client_id'), fn (Builder $query) => $query->where('client_id', $request->integer('client_id')))
            ->when($request->filled('from'), fn (Builder $query) => $query->whereDate('issue_date', '>=', $request->date('from')))
            ->when($request->filled('to'), fn (Builder $query) => $query->whereDate('issue_date', '<=', $request->date('to')));

        return InvoiceResource::collection(
            $this->applySort($invoices, $request, ['number', 'issue_date', 'due_date', 'total', 'created_at'])
                ->orderByDesc('id')
                ->paginate($this->perPage($request))
        );
    }

    /**
     * Defaults for the editor: currency, tax, dates, the next number and
     * how much of the monthly allowance is left.
     */
    public function defaults(): JsonResponse
    {
        return response()->json(['data' => $this->invoices->defaults()]);
    }

    public function store(InvoiceRequest $request): JsonResponse
    {
        $invoice = $this->invoices->create($request->validated(), $request->user());

        return $this->successWithData(new InvoiceResource($invoice), 'Invoice created', 201);
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        return new InvoiceResource($invoice->load('items', 'client'));
    }

    public function update(InvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $invoice = $this->invoices->update($invoice, $request->validated());

        return $this->successWithData(new InvoiceResource($invoice), 'Invoice updated');
    }

    /**
     * Only drafts are deleted; anything the client may have seen is voided
     * instead, so its number stays accounted for.
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        abort_unless($invoice->status === InvoiceStatus::Draft, 422, 'Only drafts can be deleted. Void a sent invoice instead.');

        $invoice->delete();

        return $this->success('Invoice deleted');
    }

    public function markSent(Invoice $invoice): JsonResponse
    {
        return $this->successWithData(new InvoiceResource($this->invoices->markSent($invoice)->load('items', 'client')), 'Invoice marked as sent');
    }

    public function email(EmailInvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        /** @var array{to: string, cc?: list<string>|null, subject: string, message: string} $data */
        $data = $request->validated();
        $invoice = $this->invoices->email($invoice, $data, $request->user());

        return $this->successWithData(new InvoiceResource($invoice->load('items', 'client')), "Invoice emailed to {$data['to']}");
    }

    public function markPaid(Request $request, Invoice $invoice): JsonResponse
    {
        $validated = $request->validate(['paid_at' => ['nullable', 'date', 'before_or_equal:today']]);

        return $this->successWithData(new InvoiceResource($this->invoices->markPaid($invoice, $validated['paid_at'] ?? null)->load('items', 'client')), 'Invoice marked as paid');
    }

    public function markUnpaid(Invoice $invoice): JsonResponse
    {
        return $this->successWithData(new InvoiceResource($this->invoices->markUnpaid($invoice)->load('items', 'client')), 'Payment removed');
    }

    public function void(Invoice $invoice): JsonResponse
    {
        return $this->successWithData(new InvoiceResource($this->invoices->void($invoice)->load('items', 'client')), 'Invoice voided');
    }

    public function duplicate(Request $request, Invoice $invoice): JsonResponse
    {
        $copy = $this->invoices->duplicate($invoice->load('items'), $request->user());

        return $this->successWithData(new InvoiceResource($copy), 'Invoice duplicated', 201);
    }

    public function pdf(Invoice $invoice, InvoicePdf $pdf): Response
    {
        return $pdf->download($invoice);
    }
}
