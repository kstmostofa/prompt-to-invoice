<?php

namespace App\Models;

use App\Enums\WorkspaceStatus;
use Database\Factories\WorkspaceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Cashier\Billable;

/**
 * @property WorkspaceStatus $status
 * @property-read WorkspaceMembership|null $membership Set when loaded through User::workspaces().
 */
class Workspace extends Model
{
    /*
     * The workspace is the Stripe customer. Cashier's invoices() (Stripe
     * invoices) is shadowed by our own invoices() relation; Stripe invoices
     * are shown in the billing portal, so it is only kept as stripeInvoices().
     */
    use Billable {
        Billable::invoices as stripeInvoices;
    }

    /** @use HasFactory<WorkspaceFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'owner_id',
        'plan_id',
        'status',
        'suspended_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => WorkspaceStatus::class,
            'suspended_at' => 'datetime',
            'trial_ends_at' => 'datetime',
        ];
    }

    /**
     * Stripe receipts and the portal go to the owner.
     */
    public function stripeEmail(): ?string
    {
        return $this->owner?->email;
    }

    public function isActive(): bool
    {
        return $this->status === WorkspaceStatus::Active;
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * @return BelongsTo<Plan, $this>
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * @return BelongsToMany<User, $this, WorkspaceMembership, 'membership'>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_user')
            ->using(WorkspaceMembership::class)
            ->as('membership')
            ->withPivot('role')
            ->withTimestamps();
    }

    /**
     * @return HasMany<BusinessProfile, $this>
     */
    public function businessProfiles(): HasMany
    {
        return $this->hasMany(BusinessProfile::class);
    }

    /**
     * @return HasOne<BusinessProfile, $this>
     */
    public function defaultBusinessProfile(): HasOne
    {
        return $this->hasOne(BusinessProfile::class)->where('is_default', true);
    }

    /**
     * @return HasMany<Invoice, $this>
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * @return HasMany<Client, $this>
     */
    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }
}
