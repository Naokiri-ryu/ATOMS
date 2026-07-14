<?php

namespace App\Services\Tfp;

/**
 * TfpGensetDvorTemplate — canonical checklist and parameter list for the
 * TFP Performance Check Genset DVOR Teknik Fasilitas Penunjang form
 * (AirNav Cabang Surabaya paper form).
 *
 * The paper form has two sections:
 *   - Rows 1-16:  "URAIAN PEKERJAAN" checklist — Kondisi (Baik / Tidak Baik)
 *                 + Keterangan. Mapped to facilities() / tfp_genset_dvor_facilities,
 *                 the same shape used for the "Kondisi Fasilitas" panel on
 *                 every other TFP module.
 *   - Rows 17-33: measurement parameters — mapped to parameters() /
 *                 tfp_genset_dvor_items, using the same dynamic-columns
 *                 architecture as the other TFP modules. The default
 *                 columns_config has a single "Nilai" column since the
 *                 paper form is single-value per row (no panel grid), but
 *                 Manager Teknik / Supervisor TFP can still extend it via
 *                 the Excel-like structure editor if ever needed.
 *
 * Rows 17, 18, and 27 are visually grouped headings on the paper form
 * ("Pengukuran Tegangan Output Genset", "Pengukuran Arus Beban",
 * "Pengukuran Tegangan PLN / Output Stabilizer") each spanning several
 * individual readings — encoded via `group_label` so the frontend can
 * render a section divider without needing a separate non-editable row.
 */
class TfpGensetDvorTemplate
{
    /**
     * Default columns_config used when seeding a new record: a single
     * "Nilai" column (the paper form has no panel/grid for this section).
     */
    public static function defaultColumnsConfig(): array
    {
        return [
            ['id' => 'value', 'label' => 'Nilai', 'sub_columns' => [
                ['key' => 'value', 'label' => 'Nilai'],
            ]],
        ];
    }

    /**
     * Returns the canonical list of measurement parameters (paper rows 17-33).
     */
    public static function parameters(): array
    {
        return [
            // ── 17. Pengukuran Tegangan Output Genset ───────────
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V R-N', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V R-S', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V S-N', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V R-T', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V T-N', 'unit' => 'Vac'],
            ['parameter_number' => '17', 'group_label' => 'Pengukuran Tegangan Output Genset', 'parameter_name' => 'V S-T', 'unit' => 'Vac'],
            // ── 18. Pengukuran Arus Beban ────────────────────────
            ['parameter_number' => '18', 'group_label' => 'Pengukuran Arus Beban', 'parameter_name' => 'I R', 'unit' => 'Ampere'],
            ['parameter_number' => '18', 'group_label' => 'Pengukuran Arus Beban', 'parameter_name' => 'I S', 'unit' => 'Ampere'],
            ['parameter_number' => '18', 'group_label' => 'Pengukuran Arus Beban', 'parameter_name' => 'I T', 'unit' => 'Ampere'],
            // ── 19-26. Single-value readings ────────────────────
            ['parameter_number' => '19', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Frequency',                       'unit' => 'Hz'],
            ['parameter_number' => '20', 'group_label' => null, 'parameter_name' => 'Pemeriksaan RPM',                             'unit' => 'Rpm'],
            ['parameter_number' => '21', 'group_label' => null, 'parameter_name' => 'Pengukuran Tegangan Battery Starter',         'unit' => 'Vdc'],
            ['parameter_number' => '22', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Jam Kerja Mesin (Hour Counter)',  'unit' => 'Hr'],
            ['parameter_number' => '23', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Oil Pressure',                    'unit' => 'Bar'],
            ['parameter_number' => '24', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Temperatur Cooling Water',        'unit' => '°C'],
            ['parameter_number' => '25', 'group_label' => null, 'parameter_name' => 'Temperatur Ruangan Genset',                   'unit' => '°C'],
            ['parameter_number' => '26', 'group_label' => null, 'parameter_name' => 'Daya yang terpakai',                          'unit' => 'KW'],
            // ── 27. Pengukuran Tegangan PLN / Output Stabilizer ──
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V R-N', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V R-S', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V S-N', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V R-T', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V T-N', 'unit' => 'Vac'],
            ['parameter_number' => '27', 'group_label' => 'Pengukuran Tegangan PLN / Output Stabilizer', 'parameter_name' => 'V S-T', 'unit' => 'Vac'],
            // ── 28-33. Single-value readings ────────────────────
            ['parameter_number' => '28', 'group_label' => null, 'parameter_name' => 'KWH Meter',                       'unit' => null],
            ['parameter_number' => '29', 'group_label' => null, 'parameter_name' => 'BBM yang terpakai',               'unit' => 'Liter'],
            ['parameter_number' => '30', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Tangki Induk',        'unit' => 'Liter'],
            ['parameter_number' => '31', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Tangki Harian',       'unit' => 'Liter'],
            ['parameter_number' => '32', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Cadangan Battery',    'unit' => 'Liter'],
            ['parameter_number' => '33', 'group_label' => null, 'parameter_name' => 'Pemeriksaan Cadangan Oli Pelumas','unit' => 'Liter'],
        ];
    }

    /**
     * Returns the canonical checklist (paper rows 1-16, "URAIAN PEKERJAAN").
     * Mapped to facilities() — same shape as every other TFP module's
     * "Kondisi Fasilitas" panel (facility_name + kondisi + keterangan).
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

    /**
     * Flatten parameters into DB row inserts for tfp_genset_dvor_items.
     */
    public static function buildItemRows(int $recordId): array
    {
        $rows = [];
        $sortOrder = 0;
        $now = now();

        foreach (self::parameters() as $param) {
            $rows[] = [
                'genset_dvor_record_id' => $recordId,
                'parameter_number'      => $param['parameter_number'],
                'group_label'           => $param['group_label'],
                'parameter_name'        => $param['parameter_name'],
                'unit'                  => $param['unit'],
                'values'                => null,
                'is_disabled_map'       => null,
                'merge_map'             => null,
                'sort_order'            => $sortOrder++,
                'created_at'            => $now,
                'updated_at'            => $now,
            ];
        }

        return $rows;
    }

    /**
     * Flatten checklist rows into DB row inserts for tfp_genset_dvor_facilities.
     */
    public static function buildFacilityRows(int $recordId): array
    {
        $rows = [];
        $sortOrder = 0;
        $now = now();

        foreach (self::facilities() as $facility) {
            $rows[] = [
                'genset_dvor_record_id' => $recordId,
                'facility_name'         => $facility['facility_name'],
                'kondisi'               => null,
                'keterangan'            => null,
                'sort_order'            => $sortOrder++,
                'created_at'            => $now,
                'updated_at'            => $now,
            ];
        }

        return $rows;
    }
}