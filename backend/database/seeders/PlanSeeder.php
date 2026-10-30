<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * The four plans from the product brief. Idempotent: keyed by slug.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Freelancers & solo founders',
                'monthly_price' => 0,
                'monthly_invoice_limit' => 5,
                'business_profile_limit' => 1,
                'seat_limit' => 1,
                'has_ai_generation' => true,
                'features' => ['Up to 5 invoices/month', '1 business profile', 'USD/EUR'],
                'sort_order' => 1,
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'Growing small businesses',
                'monthly_price' => 15,
                'monthly_invoice_limit' => null,
                'business_profile_limit' => 1,
                'seat_limit' => 1,
                'has_ai_generation' => true,
                'features' => ['Unlimited invoices', 'AI generation', 'Branded templates', 'Dashboard analytics'],
                'sort_order' => 2,
            ],
            [
                'name' => 'Business',
                'slug' => 'business',
                'description' => 'Agencies & multi-client teams',
                'monthly_price' => 39,
                'monthly_invoice_limit' => null,
                'business_profile_limit' => null,
                'seat_limit' => 5,
                'has_ai_generation' => true,
                'features' => ['Multiple business profiles', 'Team seats', 'Priority support', 'Advanced reporting'],
                'sort_order' => 3,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'High-volume organizations',
                'monthly_price' => null,
                'monthly_invoice_limit' => null,
                'business_profile_limit' => null,
                'seat_limit' => null,
                'has_ai_generation' => true,
                'features' => ['API access', 'Custom integrations', 'SLA', 'Dedicated onboarding'],
                'sort_order' => 4,
            ],
        ];

        foreach ($plans as $plan) {
            // A price set in .env wins; otherwise keep what an admin entered.
            $price = config("services.stripe.prices.{$plan['slug']}");
            if (filled($price)) {
                $plan['stripe_price_id'] = $price;
            }

            Plan::query()->updateOrCreate(['slug' => $plan['slug']], [...$plan, 'currency' => 'USD', 'is_active' => true]);
        }
    }
}
