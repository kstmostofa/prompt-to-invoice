<?php

namespace App\Models;

use Database\Factories\PlanFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    /** @use HasFactory<PlanFactory> */
    use HasFactory;

    public const FREE_SLUG = 'starter';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'currency',
        'stripe_price_id',
        'monthly_invoice_limit',
        'business_profile_limit',
        'seat_limit',
        'has_ai_generation',
        'features',
        'is_active',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'monthly_invoice_limit' => 'integer',
            'business_profile_limit' => 'integer',
            'seat_limit' => 'integer',
            'has_ai_generation' => 'boolean',
            'features' => 'array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * The plan new workspaces start on, and fall back to when a paid
     * subscription ends.
     */
    public static function free(): ?self
    {
        return self::query()->where('slug', self::FREE_SLUG)->first();
    }

    public function isPurchasable(): bool
    {
        return $this->is_active && $this->stripe_price_id !== null;
    }

    /**
     * @return HasMany<Workspace, $this>
     */
    public function workspaces(): HasMany
    {
        return $this->hasMany(Workspace::class);
    }
}
