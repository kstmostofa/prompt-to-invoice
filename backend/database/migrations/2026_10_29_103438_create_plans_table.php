<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->decimal('monthly_price', 10, 2)->nullable();
            $table->string('currency', 3)->default('USD');
            // Null means unlimited.
            $table->unsignedInteger('monthly_invoice_limit')->nullable();
            $table->unsignedInteger('business_profile_limit')->nullable();
            $table->unsignedInteger('seat_limit')->nullable();
            $table->boolean('has_ai_generation')->default(false);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
