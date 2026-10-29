<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Plan>
 */
class PlanFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->word();

        return [
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'monthly_price' => fake()->randomElement([0, 15, 39]),
            'currency' => 'USD',
            'monthly_invoice_limit' => null,
            'business_profile_limit' => 1,
            'seat_limit' => 1,
            'has_ai_generation' => true,
            'features' => [],
            'is_active' => true,
            'sort_order' => 0,
        ];
    }
}
