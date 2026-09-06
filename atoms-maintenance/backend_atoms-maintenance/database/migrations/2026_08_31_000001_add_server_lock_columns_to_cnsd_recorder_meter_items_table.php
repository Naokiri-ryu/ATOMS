<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add per-server lock flags to cnsd_recorder_meter_items.
 *
 * Channels 21-35 may carry a fixed "U/S" on one of Server A / Server B while
 * the other server stays editable. Locked cells are seeded 'U/S' and flagged
 * here so the frontend disables them and the backend ignores writes to them.
 * Applies to newly created records only.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('cnsd_recorder_meter_items', function (Blueprint $table) {
            $table->boolean('server_a_locked')->default(false)->after('block_reason');
            $table->boolean('server_b_locked')->default(false)->after('server_a_locked');
        });
    }

    public function down(): void
    {
        Schema::table('cnsd_recorder_meter_items', function (Blueprint $table) {
            $table->dropColumn(['server_a_locked', 'server_b_locked']);
        });
    }
};