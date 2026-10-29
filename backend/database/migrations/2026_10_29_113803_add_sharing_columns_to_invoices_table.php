<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // The secret in the client's view link: /i/{public_token}.
            $table->string('public_token', 64)->nullable()->unique()->after('number');
            $table->timestamp('emailed_at')->nullable()->after('sent_at');
            $table->string('last_emailed_to')->nullable()->after('emailed_at');
            $table->timestamp('viewed_at')->nullable()->after('last_emailed_to');
        });

        DB::table('invoices')->whereNull('public_token')->orderBy('id')->each(function (object $invoice): void {
            DB::table('invoices')->where('id', $invoice->id)->update(['public_token' => Str::random(40)]);
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropUnique(['public_token']);
            $table->dropColumn(['public_token', 'emailed_at', 'last_emailed_to', 'viewed_at']);
        });
    }
};
