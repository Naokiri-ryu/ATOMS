<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add receiver-specific columns to cnsd_transmitter_meter_items.
 *
 * Used by the RECEIVER section in the VHF ER Gedung Radar form (CNSD-017).
 * These columns are NULL for regular transmitter rows.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('cnsd_transmitter_meter_items', function (Blueprint $table) {
            $table->string('status_a', 30)->nullable()->after('tx_label');
            $table->string('status_b', 30)->nullable()->after('status_a');
            $table->string('squelch_tx1', 60)->nullable()->after('status_b');
            $table->string('squelch_tx2', 60)->nullable()->after('squelch_tx1');
        });
    }

    public function down(): void
    {
        Schema::table('cnsd_transmitter_meter_items', function (Blueprint $table) {
            $table->dropColumn(['status_a', 'status_b', 'squelch_tx1', 'squelch_tx2']);
        });
    }
};
