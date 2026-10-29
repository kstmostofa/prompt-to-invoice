<?php

namespace App\Http\Resources;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Plan */
class PlanResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            // Null: custom pricing (Enterprise).
            'monthly_price' => $this->monthly_price,
            'currency' => $this->currency,
            'monthly_invoice_limit' => $this->monthly_invoice_limit,
            'business_profile_limit' => $this->business_profile_limit,
            'seat_limit' => $this->seat_limit,
            'has_ai_generation' => $this->has_ai_generation,
            'features' => $this->features ?? [],
            'is_active' => $this->is_active,
            'sort_order' => $this->sort_order,
            'workspaces_count' => $this->whenCounted('workspaces'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
