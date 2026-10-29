<?php

namespace Database\Seeders;

use App\Models\BusinessProfile;
use App\Models\Client;
use App\Models\Plan;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Plans always; demo accounts only outside production.
     */
    public function run(): void
    {
        $this->call(PlanSeeder::class);

        if (app()->isProduction()) {
            return;
        }

        User::query()->firstOrCreate(['email' => 'admin@prompttoinvoice.test'], [
            'name' => 'Platform Admin',
            'password' => 'password',
            'is_admin' => true,
            'email_verified_at' => now(),
        ]);

        if (User::query()->where('email', 'demo@prompttoinvoice.test')->exists()) {
            return;
        }

        $owner = User::factory()->create([
            'name' => 'Demo Owner',
            'email' => 'demo@prompttoinvoice.test',
        ]);

        $workspace = Workspace::factory()->for($owner, 'owner')->create([
            'name' => 'Demo Studio',
            'plan_id' => Plan::query()->where('slug', 'professional')->value('id'),
        ]);

        BusinessProfile::factory()->for($workspace)->create(['name' => 'Demo Studio LLC', 'currency' => 'USD']);
        Client::factory()->count(12)->for($workspace)->create();
    }
}
