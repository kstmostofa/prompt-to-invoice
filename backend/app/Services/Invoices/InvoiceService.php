<?php

namespace App\Services\Invoices;

use App\Enums\DiscountType;
use App\Enums\InvoiceStatus;
use App\Mail\InvoiceMail;
use App\Models\BusinessProfile;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\User;
use App\Support\CurrentWorkspace;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class InvoiceService
{
    public function __construct(
        private InvoiceCalculator $calculator,
        private CurrentWorkspace $current,
    ) {}

    /**
     * What a new invoice starts from: the business profile's defaults.
     *
     * @return array<string, mixed>
     */
    public function defaults(): array
    {
        $profile = $this->profile();

        return [
            'currency' => $profile->currency,
            'tax_rate' => $profile->default_tax_rate,
            'payment_terms_days' => $profile->payment_terms_days,
            'issue_date' => today()->toDateString(),
            'due_date' => today()->addDays($profile->payment_terms_days)->toDateString(),
            'next_number' => $this->formatNumber($profile, $profile->next_invoice_number),
            'footer' => $profile->invoice_footer,
            'usage' => $this->usage(),
        ];
    }

    /**
     * Invoices created this month against the plan's monthly allowance.
     *
     * @return array{used: int, limit: int|null}
     */
    public function usage(): array
    {
        return [
            // Deleted drafts still count, or the limit could be dodged.
            'used' => Invoice::query()->withTrashed()->where('created_at', '>=', now()->startOfMonth())->count(),
            'limit' => $this->current->get()->plan?->monthly_invoice_limit,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $creator): Invoice
    {
        $usage = $this->usage();

        if ($usage['limit'] !== null && $usage['used'] >= $usage['limit']) {
            throw ValidationException::withMessages([
                'plan' => ["Your plan includes {$usage['limit']} invoices a month, and you have used them all. Upgrade to keep invoicing this month."],
            ]);
        }

        return DB::transaction(function () use ($data, $creator): Invoice {
            $profile = BusinessProfile::query()->whereKey($this->profile()->id)->lockForUpdate()->firstOrFail();

            $invoice = new Invoice([
                'business_profile_id' => $profile->id,
                'created_by' => $creator->id,
                'number' => $this->claimNumber($profile),
                'status' => InvoiceStatus::Draft,
                'from_details' => $this->fromDetails($profile),
            ]);

            return $this->fill($invoice, $data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Invoice $invoice, array $data): Invoice
    {
        if (! $invoice->status->isEditable()) {
            throw ValidationException::withMessages([
                'status' => ['Paid and void invoices can no longer be edited. Duplicate it to start a new one.'],
            ]);
        }

        return DB::transaction(function () use ($invoice, $data): Invoice {
            // A draft follows the business profile until it is sent; a sent
            // invoice keeps the details the client received.
            if ($invoice->status === InvoiceStatus::Draft && $invoice->businessProfile) {
                $invoice->from_details = $this->fromDetails($invoice->businessProfile);
            }

            return $this->fill($invoice, $data);
        });
    }

    public function markSent(Invoice $invoice): Invoice
    {
        $this->guardTransition($invoice, [InvoiceStatus::Draft, InvoiceStatus::Sent], 'sent');
        $invoice->update(['status' => InvoiceStatus::Sent, 'sent_at' => $invoice->sent_at ?? now()]);

        return $invoice;
    }

    /**
     * Email the invoice with its PDF, and count a draft as sent.
     *
     * @param  array{to: string, cc?: list<string>|null, subject: string, message: string}  $data
     */
    public function email(Invoice $invoice, array $data, User $sender): Invoice
    {
        if (! $sender->hasVerifiedEmail()) {
            throw ValidationException::withMessages([
                'to' => ['Verify your email address before sending invoices. Check your inbox for the link, or resend it from the banner.'],
            ]);
        }

        if ($invoice->status === InvoiceStatus::Void) {
            throw ValidationException::withMessages(['status' => ['A void invoice cannot be sent.']]);
        }

        if ($invoice->status === InvoiceStatus::Draft) {
            $this->markSent($invoice);
        }

        $invoice->update(['emailed_at' => now(), 'last_emailed_to' => $data['to']]);

        Mail::to($data['to'])
            ->cc($data['cc'] ?? [])
            ->queue(new InvoiceMail($invoice, $data['subject'], $data['message']));

        return $invoice;
    }

    public function markPaid(Invoice $invoice, ?string $paidAt = null): Invoice
    {
        $this->guardTransition($invoice, [InvoiceStatus::Draft, InvoiceStatus::Sent], 'marked as paid');
        $invoice->update([
            'status' => InvoiceStatus::Paid,
            'sent_at' => $invoice->sent_at ?? now(),
            'paid_at' => $paidAt ?? now(),
        ]);

        return $invoice;
    }

    /**
     * Back to unpaid, for a payment recorded by mistake.
     */
    public function markUnpaid(Invoice $invoice): Invoice
    {
        $this->guardTransition($invoice, [InvoiceStatus::Paid], 'marked as unpaid');
        $invoice->update(['status' => InvoiceStatus::Sent, 'paid_at' => null]);

        return $invoice;
    }

    public function void(Invoice $invoice): Invoice
    {
        $this->guardTransition($invoice, [InvoiceStatus::Draft, InvoiceStatus::Sent], 'voided');
        $invoice->update(['status' => InvoiceStatus::Void, 'voided_at' => now()]);

        return $invoice;
    }

    /**
     * A new draft with the same client, lines and terms, dated today.
     */
    public function duplicate(Invoice $source, User $creator): Invoice
    {
        $terms = $source->issue_date->diffInDays($source->due_date);

        return $this->create([
            'client_id' => $source->client_id,
            'issue_date' => today()->toDateString(),
            'due_date' => today()->addDays((int) $terms)->toDateString(),
            'currency' => $source->currency,
            'discount_type' => $source->discount_type?->value,
            'discount_value' => $source->discount_value,
            'tax_rate' => $source->tax_rate,
            'reverse_charge' => $source->reverse_charge,
            'notes' => $source->notes,
            'footer' => $source->footer,
            'items' => $source->items->map(fn ($item) => $item->only(['description', 'quantity', 'unit', 'unit_price']))->all(),
        ], $creator);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function fill(Invoice $invoice, array $data): Invoice
    {
        /** @var list<array{description: string, quantity: string|int|float, unit?: string|null, unit_price: string|int|float}> $items */
        $items = array_values($data['items']);
        $discountType = isset($data['discount_type']) ? DiscountType::from($data['discount_type']) : null;
        $reverseCharge = (bool) ($data['reverse_charge'] ?? false);

        $totals = $this->calculator->calculate(
            $items,
            $discountType,
            $discountType ? ($data['discount_value'] ?? 0) : 0,
            $data['tax_rate'] ?? 0,
            $reverseCharge,
        );

        $client = Client::query()->withTrashed()->findOrFail($data['client_id']);

        $invoice->fill([
            'client_id' => $client->id,
            'to_details' => $invoice->exists && $invoice->status !== InvoiceStatus::Draft && $invoice->client_id === $client->id
                ? $invoice->to_details
                : $this->toDetails($client),
            'issue_date' => $data['issue_date'],
            'due_date' => $data['due_date'],
            'currency' => $data['currency'],
            'discount_type' => $discountType,
            'discount_value' => $discountType ? ($data['discount_value'] ?? 0) : 0,
            'tax_rate' => $data['tax_rate'] ?? 0,
            'reverse_charge' => $reverseCharge,
            'notes' => $data['notes'] ?? null,
            'footer' => $data['footer'] ?? null,
            'source_prompt' => $data['source_prompt'] ?? $invoice->source_prompt,
            'subtotal' => $totals['subtotal'],
            'discount_total' => $totals['discount_total'],
            'tax_total' => $totals['tax_total'],
            'total' => $totals['total'],
        ])->save();

        $invoice->items()->delete();
        $invoice->items()->createMany(array_map(fn (array $item, int $index): array => [
            'description' => $item['description'],
            'quantity' => $item['quantity'],
            'unit' => $item['unit'] ?? null,
            'unit_price' => $item['unit_price'],
            'amount' => $totals['items'][$index],
            'sort_order' => $index,
        ], $items, array_keys($items)));

        return $invoice->load('items', 'client');
    }

    /**
     * @param  list<InvoiceStatus>  $from
     */
    private function guardTransition(Invoice $invoice, array $from, string $verb): void
    {
        if (! in_array($invoice->status, $from, true)) {
            throw ValidationException::withMessages([
                'status' => ["A {$invoice->displayStatus()} invoice cannot be {$verb}."],
            ]);
        }
    }

    /**
     * Take the profile's next number, skipping any already used (the number
     * can be edited by hand, so it may point back at an existing invoice).
     */
    private function claimNumber(BusinessProfile $profile): string
    {
        $next = $profile->next_invoice_number;

        while (Invoice::query()->withTrashed()->where('number', $this->formatNumber($profile, $next))->exists()) {
            $next++;
        }

        $profile->update(['next_invoice_number' => $next + 1]);

        return $this->formatNumber($profile, $next);
    }

    private function formatNumber(BusinessProfile $profile, int $number): string
    {
        return $profile->invoice_prefix.str_pad((string) $number, 4, '0', STR_PAD_LEFT);
    }

    private function profile(): BusinessProfile
    {
        return BusinessProfile::query()->where('is_default', true)->first()
            ?? BusinessProfile::query()->create(['name' => $this->current->get()->name, 'is_default' => true])->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    private function fromDetails(BusinessProfile $profile): array
    {
        return [
            ...$profile->only(['name', 'email', 'phone', 'website', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country', 'tax_id']),
            'logo_path' => $profile->logo_path && BusinessProfile::logoDisk()->exists($profile->logo_path) ? $profile->logo_path : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function toDetails(Client $client): array
    {
        return $client->only(['name', 'company', 'email', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country', 'tax_id']);
    }
}
