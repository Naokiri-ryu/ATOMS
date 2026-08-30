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
            ->where('section_code', '3')
            ->whereIn('transmitter_meter_record_id', $erIds)
            ->where('frequency_label', 'Pemeriksaan UPS')
            ->delete();
    }

    public function down(): void
    {
        // Re-insert UPS items for ER records
        $erRecords = DB::table('cnsd_transmitter_meter_records')
            ->where('form_type', 'TRANSMITTER-ER')
            ->get();

        if ($erRecords->isEmpty()) {
            return;
        }

        $now = now();
        $rows = [];

        foreach ($erRecords as $record) {
            $maxSort = DB::table('cnsd_transmitter_meter_items')
                ->where('transmitter_meter_record_id', $record->id)
                ->max('sort_order') ?? 0;

            $rows[] = [
                'transmitter_meter_record_id' => $record->id,
                'section_code'                => '3',
                'section_name'                => 'LINGKUNGAN KERJA',
                'group_number'                => null,
                'group_name'                  => 'LINGKUNGAN KERJA',
                'frequency_label'             => 'Pemeriksaan UPS',
                'merk'                        => null,
                'tx_label'                    => null,
                'status_value'                => null,
                'power_output'                => null,
                'modulasi'                    => null,
                'keterangan'                  => null,
                'status_a'                    => null,
                'status_b'                    => null,
                'squelch_tx1'                 => null,
                'squelch_tx2'                 => null,
                'nominal'                     => '✓',
                'hasil'                       => null,
                'is_header'                   => false,
                'is_blocked'                  => false,
                'block_reason'                => null,
                'sort_order'                  => $maxSort + 1,
                'created_at'                  => $now,
                'updated_at'                  => $now,
            ];
        }

        if (!empty($rows)) {
            DB::table('cnsd_transmitter_meter_items')->insert($rows);
        }
    }
};
