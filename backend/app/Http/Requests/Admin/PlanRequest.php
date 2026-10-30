<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PlanRequest extends FormRequest
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
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', Rule::unique('plans', 'slug')->ignore($this->route('plan'))],
            'description' => ['nullable', 'string', 'max:255'],
            'monthly_price' => ['nullable', 'numeric', 'min:0'],
            'stripe_price_id' => ['nullable', 'string', 'max:255', 'starts_with:price_', Rule::unique('plans', 'stripe_price_id')->ignore($this->route('plan'))],
            'monthly_invoice_limit' => ['nullable', 'integer', 'min:1'],
            'business_profile_limit' => ['nullable', 'integer', 'min:1'],
            'seat_limit' => ['nullable', 'integer', 'min:1'],
            'has_ai_generation' => ['boolean'],
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:255'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ];
    }
}
