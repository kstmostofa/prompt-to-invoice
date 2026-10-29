<?php

namespace App\Http\Requests\Workspace;

use Illuminate\Foundation\Http\FormRequest;

class BusinessProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'website' => ['nullable', 'url', 'max:255'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'size:2'],
            'tax_id' => ['nullable', 'string', 'max:50'],
            'currency' => ['required', 'in:USD,EUR'],
            'default_tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'payment_terms_days' => ['required', 'integer', 'min:0', 'max:365'],
            'invoice_prefix' => ['required', 'string', 'max:20'],
            'next_invoice_number' => ['required', 'integer', 'min:1'],
            'invoice_footer' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
