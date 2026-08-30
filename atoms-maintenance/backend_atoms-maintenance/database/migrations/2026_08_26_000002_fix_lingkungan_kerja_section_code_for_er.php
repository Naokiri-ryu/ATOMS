<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $erIds = DB::table('cnsd_transmitter_meter_records')
            ->where('form_type', 'TRANSMITTER-ER')
            ->pluck('id');

        if ($erIds->isEmpty()) {
            return;
        }

        DB::table('cnsd_transmitter_meter_items')
            ->where('section_code', '2')
            ->whereIn('transmitter_meter_record_id', $erIds)
            ->update(['section_code' => '3', 'group_number' => null]);
    }

    public function down(): void
    {
        $erIds = DB::table('cnsd_transmitter_meter_records')
            ->where('form_type', 'TRANSMITTER-ER')
            ->pluck('id');

        if ($erIds->isEmpty()) {
            return;
        }

        DB::table('cnsd_transmitter_meter_items')
            ->where('section_code', '3')
            ->whereIn('transmitter_meter_record_id', $erIds)
            ->update(['section_code' => '2', 'group_number' => 10]);
    }
};
