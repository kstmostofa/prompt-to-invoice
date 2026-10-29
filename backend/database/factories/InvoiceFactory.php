<?php

namespace Database\Factories;

use App\Enums\InvoiceStatus;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Bare invoices with consistent figures and no lines; tests that care about
 * lines and totals go through the API so the calculator does the sums.
 *
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $total = fake()->randomFloat(2, 100, 5000);

        return [
            'workspace_id' => Workspace::factory(),
            'client_id' => fn (array $attributes) => Client::factory()->create(['workspace_id' => $attributes['workspace_id']])->id,
            'number' => 'INV-'.Str::upper(Str::random(8)),
            'status' => InvoiceStatus::Draft,
            'issue_date' => today(),
            'due_date' => today()->addDays(30),
            'currency' => 'USD',
            'subtotal' => $total,
            'discount_total' => 0,
            'tax_rate' => 0,
            'tax_total' => 0,
            'total' => $total,
            'from_details' => ['name' => fake()->company()],
            'to_details' => ['name' => fake()->name()],
        ];
    }

    public function sent(): static
    {
        return $this->state(fn () => ['status' => InvoiceStatus::Sent, 'sent_at' => now()]);
    }

    public function overdue(): static
    {
        return $this->state(fn () => [
            'status' => InvoiceStatus::Sent,
            'sent_at' => now()->subDays(40),
            'issue_date' => today()->subDays(40),
            'due_date' => today()->subDays(10),
        ]);
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => InvoiceStatus::Paid, 'sent_at' => now(), 'paid_at' => now()]);
    }
}
