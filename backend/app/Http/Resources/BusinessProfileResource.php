<?php

namespace App\Http\Resources;

use App\Models\BusinessProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin BusinessProfile */
class BusinessProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,
            'address_line1' => $this->address_line1,
            'address_line2' => $this->address_line2,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'tax_id' => $this->tax_id,
            'logo_url' => $this->logoUrl(),
            'currency' => $this->currency,
            'default_tax_rate' => $this->default_tax_rate,
            'payment_terms_days' => $this->payment_terms_days,
            'invoice_prefix' => $this->invoice_prefix,
            'next_invoice_number' => $this->next_invoice_number,
            'invoice_footer' => $this->invoice_footer,
            'is_default' => $this->is_default,
            'updated_at' => $this->updated_at,
        ];
    }
}
