<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $erRecords = DB::table('cnsd_transmitter_meter_records')
            ->where('form_type', 'TRANSMITTER-ER')
            ->pluck('id');

        if ($erRecords->isEmpty()) {
            return;
        }

        $envItems = [
            ['item_number' => '1', 'kegiatan' => 'Pemeriksaan suhu Ruangan',       'nominal' => '<22°C'],
            ['item_number' => '2', 'kegiatan' => 'Pemeriksaan Air Humidity',       'nominal' => '✓'],
            ['item_number' => '3', 'kegiatan' => 'Pemeriksaan Kebersihan Ruangan', 'nominal' => '✓'],
        ];

        $now = now();
        $rows = [];

        foreach ($erRecords as $recordId) {
            $existingCount = DB::table('cnsd_transmitter_meter_items')
                ->where('transmitter_meter_record_id', $recordId)
                ->where('section_code', '3')
                ->count();

            if ($existingCount > 0) {
                continue;
            }

            $maxSort = DB::table('cnsd_transmitter_meter_items')
                ->where('transmitter_meter_record_id', $recordId)
                ->max('sort_order') ?? 0;

            $sortOrder = $maxSort + 1;

            foreach ($envItems as $item) {
                $rows[] = [
                    'transmitter_meter_record_id' => $recordId,
                    'section_code'                => '3',
                    'section_name'                => 'LINGKUNGAN KERJA',
                    'group_number'                => null,
                    'group_name'                  => 'LINGKUNGAN KERJA',
                    'frequency_label'             => $item['kegiatan'],
                    'merk'                        => null,
                    'tx_label'                    => null,
                    'status_value'                => null,
                    'power_output'                => null,
                    'modulasi'                    => null,
                    'keterangan'                  => null,
                    'nominal'                     => $item['nominal'],
                    'hasil'                       => null,
                    'is_header'                   => false,
                    'is_blocked'                  => false,
                    'block_reason'                => null,
                    'sort_order'                  => $sortOrder++,
                    'created_at'                  => $now,
                    'updated_at'                  => $now,
                ];
            }
        }

        if (!empty($rows)) {
            DB::table('cnsd_transmitter_meter_items')->insert($rows);
        }
    }

    public function down(): void
    {
        // Remove Lingkungan Kerja items for ER records
        $erRecords = DB::table('cnsd_transmitter_meter_records')
            ->where('form_type', 'TRANSMITTER-ER')
            ->pluck('id');

        if ($erRecords->isEmpty()) {
            return;
        }

        DB::table('cnsd_transmitter_meter_items')
            ->where('section_code', '3')
            ->whereIn('transmitter_meter_record_id', $erRecords)
            ->delete();
    }
};
