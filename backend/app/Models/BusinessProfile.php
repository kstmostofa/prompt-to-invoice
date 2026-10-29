<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\BusinessProfileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class BusinessProfile extends Model
{
    /** @use HasFactory<BusinessProfileFactory> */
    use BelongsToWorkspace, HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'workspace_id',
        'name',
        'email',
        'phone',
        'website',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'tax_id',
        'logo_path',
        'currency',
        'default_tax_rate',
        'payment_terms_days',
        'invoice_prefix',
        'next_invoice_number',
        'invoice_footer',
        'is_default',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'default_tax_rate' => 'decimal:2',
            'payment_terms_days' => 'integer',
            'next_invoice_number' => 'integer',
            'is_default' => 'boolean',
        ];
    }

    public function logoUrl(): ?string
    {
        return $this->logo_path ? Storage::disk('public')->url($this->logo_path) : null;
    }
}
