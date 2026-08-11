<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Glide Path Meter Reading Section A FRONT PANEL (group 1) now uses dual
 * M1/M2 result columns, matching the Localizer Meter Reading layout.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('cnsd_glidepath_meter_items')
            ->where('section_code', 'A')
            ->where('group_number', 1)
            ->where('is_header', false)
            ->update(['hasil_layout' => 'dual']);
    }

    public function down(): void
    {
        DB::table('cnsd_glidepath_meter_items')
            ->where('section_code', 'A')
            ->where('group_number', 1)
            ->where('is_header', false)
            ->update(['hasil_layout' => 'single']);
    }
};
