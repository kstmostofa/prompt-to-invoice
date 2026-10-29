<?php

namespace App\Http\Resources;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

/** @mixin Invoice */
class InvoiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $from = $this->from_details;

        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status,
            // What people see: "overdue" for a sent invoice past its due date.
            'display_status' => $this->displayStatus(),
            'issue_date' => $this->issue_date->toDateString(),
            'due_date' => $this->due_date->toDateString(),
            'currency' => $this->currency,
            'subtotal' => $this->subtotal,
            'discount_type' => $this->discount_type,
            'discount_value' => $this->discount_value,
            'discount_total' => $this->discount_total,
            'tax_rate' => $this->tax_rate,
            'tax_total' => $this->tax_total,
            'total' => $this->total,
            'reverse_charge' => $this->reverse_charge,
            'client_id' => $this->client_id,
            'client' => $this->whenLoaded('client', fn () => $this->client ? [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'company' => $this->client->company,
                'email' => $this->client->email,
            ] : null),
            'from' => [
                ...Arr::except($from, ['logo_path']),
                'logo_url' => isset($from['logo_path']) ? Storage::disk('public')->url($from['logo_path']) : null,
            ],
            'to' => $this->to_details,
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'unit_price' => $item->unit_price,
                'amount' => $item->amount,
            ])),
            'notes' => $this->notes,
            'footer' => $this->footer,
            'source_prompt' => $this->source_prompt,
            'sent_at' => $this->sent_at,
            'paid_at' => $this->paid_at,
            'voided_at' => $this->voided_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
