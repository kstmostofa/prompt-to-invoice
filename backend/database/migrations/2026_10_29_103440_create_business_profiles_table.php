<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('website')->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country', 2)->nullable();
            $table->string('tax_id')->nullable();
            $table->string('logo_path')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->decimal('default_tax_rate', 5, 2)->default(0);
            $table->unsignedSmallInteger('payment_terms_days')->default(30);
            $table->string('invoice_prefix', 20)->default('INV-');
            $table->unsignedInteger('next_invoice_number')->default(1);
            $table->text('invoice_footer')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index(['workspace_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_profiles');
    }
};
