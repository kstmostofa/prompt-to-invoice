<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Services\Invoices\InvoicePdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

/**
 * The client's view of an invoice, by its unguessable token, without signing
 * in. Drafts are not shown: the client sees an invoice once it is sent.
 */
class PublicInvoiceController extends Controller
{
    /** Fields the client never needs to see. */
    private const PRIVATE_FIELDS = ['client_id', 'client', 'source_prompt', 'emailed_at', 'last_emailed_to', 'viewed_at', 'created_at', 'updated_at'];

    public function show(string $token): JsonResponse
    {
        $invoice = $this->find($token);

        if ($invoice->status === InvoiceStatus::Sent && $invoice->viewed_at === null) {
            $invoice->forceFill(['viewed_at' => now()])->saveQuietly();
        }

        return response()->json([
            'data' => Arr::except((new InvoiceResource($invoice->load('items')))->resolve(), self::PRIVATE_FIELDS),
        ]);
    }

    public function pdf(string $token, InvoicePdf $pdf): Response
    {
        return $pdf->download($this->find($token));
    }

    private function find(string $token): Invoice
    {
        return Invoice::query()
            ->withoutGlobalScope('workspace')
            ->where('public_token', $token)
            ->where('status', '!=', InvoiceStatus::Draft)
            ->firstOrFail();
    }
}
