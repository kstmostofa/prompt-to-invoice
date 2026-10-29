<?php

namespace App\Models;

use App\Enums\DiscountType;
use App\Enums\InvoiceStatus;
use App\Models\Concerns\BelongsToWorkspace;
use Carbon\CarbonImmutable;
use Database\Factories\InvoiceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property InvoiceStatus $status
 * @property DiscountType|null $discount_type
 * @property CarbonImmutable $issue_date
 * @property CarbonImmutable $due_date
 * @property array<string, mixed> $from_details
 * @property array<string, mixed> $to_details
 */
class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use BelongsToWorkspace, HasFactory, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'workspace_id',
        'business_profile_id',
        'client_id',
        'created_by',
        'number',
        'status',
        'issue_date',
        'due_date',
        'currency',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount_total',
        'tax_rate',
        'tax_total',
        'total',
        'reverse_charge',
        'from_details',
        'to_details',
        'notes',
        'footer',
        'source_prompt',
        'sent_at',
        'emailed_at',
        'last_emailed_to',
        'viewed_at',
        'paid_at',
        'voided_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'discount_type' => DiscountType::class,
            'issue_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
            'reverse_charge' => 'boolean',
            'from_details' => 'array',
            'to_details' => 'array',
            'sent_at' => 'datetime',
            'emailed_at' => 'datetime',
            'viewed_at' => 'datetime',
            'paid_at' => 'datetime',
            'voided_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Every invoice gets an unguessable link for the client to view it.
        static::creating(function (Invoice $invoice): void {
            $invoice->public_token ??= Str::random(40);
        });
    }

    /**
     * Where the client views the invoice without signing in.
     */
    public function publicUrl(): string
    {
        return config('app.frontend_url').'/i/'.$this->public_token;
    }

    public function isOverdue(): bool
    {
        return $this->status === InvoiceStatus::Sent && $this->due_date->lt(today());
    }

    /**
     * The status people see: stored status, with "overdue" for a sent
     * invoice past its due date.
     */
    public function displayStatus(): string
    {
        return $this->isOverdue() ? 'overdue' : $this->status->value;
    }

    /**
     * Filter by what people see, "overdue" included.
     *
     * @param  Builder<Invoice>  $query
     * @param  list<string>  $statuses
     */
    public function scopeWithDisplayStatus(Builder $query, array $statuses): void
    {
        $query->where(function (Builder $query) use ($statuses): void {
            $stored = array_values(array_intersect($statuses, ['draft', 'paid', 'void']));

            if ($stored !== []) {
                $query->orWhereIn('status', $stored);
            }

            if (in_array('sent', $statuses, true)) {
                $query->orWhere(fn (Builder $sent) => $sent->where('status', InvoiceStatus::Sent)->whereDate('due_date', '>=', today()));
            }

            if (in_array('overdue', $statuses, true)) {
                $query->orWhere(fn (Builder $overdue) => $overdue->where('status', InvoiceStatus::Sent)->whereDate('due_date', '<', today()));
            }
        });
    }

    /**
     * @return HasMany<InvoiceItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('sort_order');
    }

    /**
     * @return BelongsTo<Client, $this>
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class)->withTrashed();
    }

    /**
     * @return BelongsTo<BusinessProfile, $this>
     */
    public function businessProfile(): BelongsTo
    {
        return $this->belongsTo(BusinessProfile::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
