<?php

namespace App\Services\Tfp;

class TfpGensetRadarTemplate
{
    public static function defaultColumnsConfig(): array
    {
        return [
            ['id' => 'value', 'label' => 'Nilai', 'sub_columns' => [
                ['key' => 'value', 'label' => 'Nilai'],
            ]],
        ];
    }

    /**
     * Measurement parameters (paper rows 17-33).
     */
    public static function parameters(): array
    {
        return [
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V R-N', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V R-S', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V S-N', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V R-T', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V T-N', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V S-T', 'unit' => 'Vac'],
            ['parameter_number' => '18', 'group_label' => 'Pengukuran Arus Beban', 'parameter_name' => 'I R', 'unit' => 'Ampere'],
            ['parameter_number' => '18', 'group_label' => 'Pengukuran Arus Beban', 'parameter_name' => 'I S', 'unit' => 'Ampere'],
            ['parameter_number' => '18', 'group_label' => 'Pengukuran Arus Beban', 'parameter_name' => 'I T', 'unit' => 'Ampere'],
            ['parameter_number' => '19', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Frequency', 'unit' => 'Hz'],
            ['parameter_number' => '20', 'group_label' => null, 'parameter_name' => 'Pemeriksaan RPM', 'unit' => 'Rpm'],
            ['parameter_number' => '21', 'group_label' => null, 'parameter_name' => 'Pengukuran Tegangan Battery Starter', 'unit' => 'Vdc'],
            ['parameter_number' => '22', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Jam Kerja Mesin (Hour Counter)', 'unit' => 'Hr'],
            ['parameter_number' => '23', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Oil Pressure', 'unit' => 'Bar'],
            ['parameter_number' => '24', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Temperatur Cooling Water', 'unit' => '°C'],
            ['parameter_number' => '25', 'group_label' => null, 'parameter_name' => 'Temperatur Ruangan Genset', 'unit' => '°C'],
            ['parameter_number' => '26', 'group_label' => null, 'parameter_name' => 'Daya yang terpakai', 'unit' => 'KW'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V R-N', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V R-S', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V S-N', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V R-T', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V T-N', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V S-T', 'unit' => 'Vac'],
            ['parameter_number' => '28', 'group_label' => null, 'parameter_name' => 'KWH Meter', 'unit' => null],
            ['parameter_number' => '29', 'group_label' => null, 'parameter_name' => 'BBM yang terpakai', 'unit' => 'Liter'],
            ['parameter_number' => '30', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Tangki Induk', 'unit' => 'Liter'],
            ['parameter_number' => '31', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Tangki Harian', 'unit' => 'Liter'],
            ['parameter_number' => '32', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Cadangan Battery', 'unit' => 'Liter'],
            ['parameter_number' => '33', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Cadangan Oli Pelumas', 'unit' => 'Liter'],
        ];
    }

    /**
     * Facility checklist (paper rows 1-16).
     */
    public static function facilities(): array
    {
        return [
            ['facility_name' => 'Pemeriksaan Battery Starter'],
            ['facility_name' => 'Pemeriksaan Level Oli Mesin'],
            ['facility_name' => 'Pemeriksaan Air Radiator'],
            ['facility_name' => 'Pemeriksaan Kontaktor-Kontaktor pada Panel ACOS'],
            ['facility_name' => 'Pemeriksaan Lampu-Lampu Indikator'],
            ['facility_name' => 'Pemeriksaan Indikator Volt meter, Ampere meter, Frequency'],
            ['facility_name' => 'Pemeriksaan Relay-relay Kontrol (Safety Devices)'],
            ['facility_name' => 'Pemeriksaan Vent Belt'],
            ['facility_name' => 'Pemeriksaan dan Membersihkan Pompa BBM'],
            ['facility_name' => 'Membersihkan Saringan Udara'],
            ['facility_name' => 'Membersihkan Genset, Panel ACOS dan Ruang Sekitarnya'],
            ['facility_name' => 'Pengetesan Genset Secara Auto No Load (tanpa beban)'],
            ['facility_name' => 'Pengetesan Genset Secara Auto On Load (dengan beban)'],
            ['facility_name' => 'Pengetesan Genset Secara Manual No Load'],
            ['facility_name' => 'Pengetesan Genset Secara Manual On Load'],
            ['facility_name' => 'Kondisi Genset'],
        ];
    }

    public static function buildItemRows(int $recordId): array
    {
        $rows = [];
        $sortOrder = 0;
        $now = now();

        foreach (self::parameters() as $param) {
            $rows[] = [
                'genset_radar_record_id' => $recordId,
                'parameter_number'       => $param['parameter_number'],
                'group_label'            => $param['group_label'],
                'parameter_name'         => $param['parameter_name'],
                'unit'                   => $param['unit'],
                'values'                 => null,
                'is_disabled_map'        => null,
                'merge_map'              => null,
                'sort_order'             => $sortOrder++,
                'created_at'             => $now,
                'updated_at'             => $now,
            ];
        }

        return $rows;
    }

    public static function buildFacilityRows(int $recordId): array
    {
        $rows = [];
        $sortOrder = 0;
        $now = now();

        foreach (self::facilities() as $facility) {
            $rows[] = [
                'genset_radar_record_id' => $recordId,
                'facility_name'          => $facility['facility_name'],
                'kondisi'                => null,
                'keterangan'             => null,
                'sort_order'             => $sortOrder++,
                'created_at'             => $now,
                'updated_at'             => $now,
            ];
        }

        return $rows;
    }
}
