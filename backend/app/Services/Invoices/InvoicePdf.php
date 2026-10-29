<?php

namespace App\Services\Invoices;

use App\Models\Invoice;
use App\Support\Money;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class InvoicePdf
{
    public function download(Invoice $invoice): Response
    {
        return Pdf::loadView('pdf.invoice', $this->data($invoice))
            ->setPaper('a4')
            ->download("Invoice {$invoice->number}.pdf");
    }

    public function render(Invoice $invoice): string
    {
        return Pdf::loadView('pdf.invoice', $this->data($invoice))->setPaper('a4')->output();
    }

    /**
     * @return array<string, mixed>
     */
    public function data(Invoice $invoice): array
    {
        $invoice->loadMissing('items');
        $from = $invoice->from_details;

        return [
            'invoice' => $invoice,
            'from' => $from,
            'to' => $invoice->to_details,
            'logo' => $this->logo($from['logo_path'] ?? null),
            'status' => $invoice->displayStatus(),
            'money' => fn (string|int|float|null $amount): string => Money::format($amount, $invoice->currency),
            'countryName' => fn (?string $code): ?string => $code ? (locale_get_display_region("-{$code}", 'en') ?: $code) : null,
        ];
    }

    /**
     * Inlined as a data URI: dompdf does not fetch remote files, and this
     * works the same on local and cloud disks.
     */
    private function logo(?string $path): ?string
    {
        if (! $path || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $mime = Storage::disk('public')->mimeType($path) ?: 'image/png';

        return "data:{$mime};base64,".base64_encode((string) Storage::disk('public')->get($path));
    }
}
