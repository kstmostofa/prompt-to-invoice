<?php

namespace Database\Factories;

use App\Models\BusinessProfile;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BusinessProfile>
 */
class BusinessProfileFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'name' => fake()->company(),
            'email' => fake()->companyEmail(),
            'phone' => fake()->phoneNumber(),
            'address_line1' => fake()->streetAddress(),
            'city' => fake()->city(),
            'postal_code' => fake()->postcode(),
            'country' => fake()->randomElement(['US', 'DE', 'FR', 'NL']),
            'currency' => fake()->randomElement(['USD', 'EUR']),
            'default_tax_rate' => 0,
            'payment_terms_days' => 30,
            'invoice_prefix' => 'INV-',
            'next_invoice_number' => 1,
            'is_default' => true,
        ];
    }
}
