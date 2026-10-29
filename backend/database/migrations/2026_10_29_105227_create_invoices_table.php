<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignId('business_profile_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('number');
            $table->string('status')->default('draft')->index();
            $table->date('issue_date');
            $table->date('due_date');
            $table->string('currency', 3);
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->string('discount_type')->nullable();
            $table->decimal('discount_value', 14, 2)->default(0);
            $table->decimal('discount_total', 14, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('tax_total', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            // EU B2B: the client accounts for VAT, so none is charged here.
            $table->boolean('reverse_charge')->default(false);
            // Copies taken when the invoice is saved, so later edits to the
            // business profile or the client never rewrite an issued invoice.
            $table->json('from_details');
            $table->json('to_details');
            $table->text('notes')->nullable();
            $table->text('footer')->nullable();
            // The prompt an AI-drafted invoice came from (week 3).
            $table->text('source_prompt')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['workspace_id', 'number']);
            $table->index(['workspace_id', 'issue_date']);
            $table->index(['workspace_id', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
