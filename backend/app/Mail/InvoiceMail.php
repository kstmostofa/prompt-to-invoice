<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Services\Invoices\InvoicePdf;
use App\Support\Money;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * The invoice to the client: the owner's message, the amount, a link to view
 * it online, and the PDF attached. Sent from the platform's address with the
 * business's name, replying to the business.
 */
class InvoiceMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string $mailSubject,
        public string $body,
    ) {}

    public function envelope(): Envelope
    {
        $from = $this->invoice->from_details;

        return new Envelope(
            from: new Address((string) config('mail.from.address'), $from['name'] ?? config('mail.from.name')),
            replyTo: ! empty($from['email']) ? [new Address($from['email'], $from['name'] ?? null)] : [],
            subject: $this->mailSubject,
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'mail.invoice',
            with: [
                'body' => $this->body,
                'number' => $this->invoice->number,
                'business' => $this->invoice->from_details['name'] ?? '',
                'amount' => Money::format($this->invoice->total, $this->invoice->currency),
                'dueDate' => $this->invoice->due_date->format('F j, Y'),
                'paid' => $this->invoice->status->value === 'paid',
                'url' => $this->invoice->publicUrl(),
            ],
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [
            Attachment::fromData(fn () => app(InvoicePdf::class)->render($this->invoice), "Invoice {$this->invoice->number}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
