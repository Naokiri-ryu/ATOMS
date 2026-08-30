<?php

namespace App\Services\Cnsd;

/**
 * CnsdTransmitterMeterTemplate — canonical Transmitter Meter Reading item list,
 * mirrored from the official "METER READING — TRANSMITTER" paper form (FORM C-1)
 * used by AirNav Surabaya.
 *
 * Form structure (per the reference image):
 *
 *   Section 1 — TRANSMITTER / TX RADIO
 *     Groups: Ground, ADC, CDU, APP, TMA West, TMA East, ER Makassar, ATIS, Back Up Radio
 *     Layout: NO | FREQUENCY | MERK | STATUS | POWER O/P | MODULASI | KETERANGAN
 *
 *   Section 2 — LINGKUNGAN KERJA
 *     Items: Suhu Ruangan, Air Humidity, Kebersihan Ruangan, UPS
 *     Layout: NO | KEGIATAN | NOMINAL | HASIL | KETERANGAN
 *
 * ER-only mode ($erOnly = true, form_type TRANSMITTER-ER = modul CNSD-017
 * "VHF ER Gedung Radar"): ER BALI & ER P.BUN transmitter + receiver sections
 * + LINGKUNGAN KERJA (3 sections total).
 */
class CnsdTransmitterMeterTemplate
{
    /**
     * Full section + group + item structure for the Transmitter Meter Reading form.
     */
    public static function sections(bool $erOnly = false): array
    {
        $transmitterGroups = $erOnly
            ? self::erOnlyGroups()
            : self::transmitterGroups();

        $sections = [
            // ───────────────────────────────────────────────────────────
            // SECTION 1 — TRANSMITTER / TX RADIO
            // ───────────────────────────────────────────────────────────
            [
                'code' => '1',
                'name' => 'TRANSMITTER / TX RADIO',
                'inputs_layout' => 'transmitter',
                'groups' => $transmitterGroups,
            ],

            // ───────────────────────────────────────────────────────────
            // SECTION 2 — LINGKUNGAN KERJA
            // ───────────────────────────────────────────────────────────
            [
                'code' => '2',
                'name' => 'LINGKUNGAN KERJA',
                'inputs_layout' => 'environment',
                'groups' => [
                    [
                        'number' => 10,
                        'name'   => 'LINGKUNGAN KERJA',
                        'items'  => [
                            ['item_number' => '1', 'kegiatan' => 'Pemeriksaan suhu Ruangan',       'nominal' => '<22°C'],
                            ['item_number' => '2', 'kegiatan' => 'Pemeriksaan Air Humidity',       'nominal' => '✓'],
                            ['item_number' => '3', 'kegiatan' => 'Pemeriksaan Kebersihan Ruangan', 'nominal' => '✓'],
                            ['item_number' => '4', 'kegiatan' => 'Pemeriksaan UPS',                'nominal' => '✓'],
                        ],
                        // NOTE: env kegiatan text is stored in `frequency_label` column
                        // since the items schema has no dedicated item_name field.
                    ],
                ],
            ],
        ];

        if ($erOnly) {
            // ER form: add RECEIVER section between transmitter and environment.
            $receiverSection = [
                'code'          => '2',
                'name'          => 'RECEIVER',
                'inputs_layout' => 'receiver',
                'groups'        => self::erOnlyReceiverGroups(),
            ];
            $envSection = $sections[1];
            $envSection['code'] = '3';
            $envSection['groups'][0]['items'] = array_slice($envSection['groups'][0]['items'], 0, 3);
            $envSection['groups'][0]['number'] = null;
            return [$sections[0], $receiverSection, $envSection];
        }

        return $sections;
    }

    /**
     * Transmitter / TX Radio groups based on the reference image.
     */
    private static function transmitterGroups(): array
    {
        return [
            // ─── 1. Ground ─────────────────────────────────────────
            [
                'number' => 1,
                'name'   => 'Ground',
                'items'  => [
                    // Primary 118.9 MHz — PAE
                    ['frequency_label' => 'Primary 118.9 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 118.9 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                    // Secondary 119.15 MHz — OTE
                    ['frequency_label' => 'Secondary 119.15 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Secondary 119.15 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 2', 'status_type' => 'online_offline'],
                ],
            ],

            // ─── 2. ADC ────────────────────────────────────────────
            [
                'number' => 2,
                'name'   => 'ADC',
                'items'  => [
                    ['frequency_label' => 'Primary 118.3 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 118.3 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Secondary 118.1 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Secondary 118.1 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 2', 'status_type' => 'online_offline'],
                ],
            ],

            // ─── 3. CDU ────────────────────────────────────────────
            [
                'number' => 3,
                'name'   => 'CDU',
                'items'  => [
                    ['frequency_label' => 'Primary 121.65 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Primary 121.65 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Secondary 121.8 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                ],
            ],

            // ─── 4. APP ────────────────────────────────────────────
            [
                'number' => 4,
                'name'   => 'APP',
                'items'  => [
                    ['frequency_label' => 'Primary 123.2 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 123.2 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Secondary 124.5 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Secondary 124.5 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 2', 'status_type' => 'online_offline'],
                ],
            ],

            // ─── 5. TMA West ───────────────────────────────────────
            [
                'number' => 5,
                'name'   => 'TMA West',
                'items'  => [
                    ['frequency_label' => 'Primary 125.1 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 125.1 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Secondary 123.55 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Secondary 123.55 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                ],
            ],

            // ─── 6. TMA East ───────────────────────────────────────
            [
                'number' => 6,
                'name'   => 'TMA East',
                'items'  => [
                    ['frequency_label' => 'Primary 124.0 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 124.0 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Secondary 122.85 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Secondary 122.85 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 2', 'status_type' => 'online_offline'],
                ],
            ],

            // ─── 7. ER Makassar ────────────────────────────────────
            [
                'number' => 7,
                'name'   => 'ER Makassar',
                'items'  => [
                    ['frequency_label' => 'Primary 123.9 MHz (-5 KHz)', 'merk' => 'OTE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 123.9 MHz (-5 KHz)', 'merk' => 'OTE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Secondary 125.9 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Secondary 125.9 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'online_offline'],
                ],
            ],

            // ─── 8. ATIS ─────────────────────────────────────────
            [
                'number' => 8,
                'name'   => 'ATIS',
                'items'  => [
                    ['frequency_label' => 'Primary 128.2 MHz', 'merk' => null, 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 128.2 MHz', 'merk' => null, 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                ],
            ],

            // ─── 9. Back Up Radio ────────────────────────────────
            // Status column is BLOCKED (grey/disabled) per the reference image.
            [
                'number' => 9,
                'name'   => 'Back Up Radio',
                'items'  => [
                    ['frequency_label' => '118.1 MHz', 'merk' => 'Becker', 'tx_label' => null, 'status_type' => 'blocked'],
                    ['frequency_label' => '123.2 MHz', 'merk' => 'OTE',    'tx_label' => null, 'status_type' => 'blocked'],
                    ['frequency_label' => '122.85 MHz', 'merk' => 'PAE',   'tx_label' => null, 'status_type' => 'blocked'],
                    ['frequency_label' => '119.15 MHz', 'merk' => 'PAE',   'tx_label' => null, 'status_type' => 'blocked'],
                ],
            ],
        ];
    }

    /**
     * ER-only transmitter groups for CNSD-017 "VHF ER Gedung Radar".
     * These groups are standalone (no longer part of the main Transmitter form).
     */
    private static function erOnlyGroups(): array
    {
        return [
            [
                'number' => 1,
                'name'   => 'ER BALI',
                'items'  => [
                    ['frequency_label' => 'Primary 120.7 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 120.7 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                ],
            ],
            [
                'number' => 2,
                'name'   => 'ER P.BUN',
                'items'  => [
                    ['frequency_label' => 'Primary 134.1 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 1', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Primary 134.1 MHz', 'merk' => 'OTE', 'tx_label' => 'TX 2', 'status_type' => 'on_air_stby'],
                    ['frequency_label' => 'Secondary 133.6 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 1', 'status_type' => 'online_offline'],
                    ['frequency_label' => 'Secondary 133.6 MHz', 'merk' => 'PAE', 'tx_label' => 'TX 2', 'status_type' => 'online_offline'],
                ],
            ],
        ];
    }

    /**
     * ER-only receiver groups for CNSD-017 "VHF ER Gedung Radar" Section 2.
     * Each item is a receive frequency for ER BALI / ER P.BUN.
     */
    private static function erOnlyReceiverGroups(): array
    {
        return [
            [
                'number' => 1,
                'name'   => 'ER BALI',
                'items'  => [
                    ['frequency_label' => '120.70 MHz'],
                ],
            ],
            [
                'number' => 2,
                'name'   => 'ER P.BUN',
                'items'  => [
                    ['frequency_label' => '134.10 MHz'],
                    ['frequency_label' => '133.60 MHz'],
                ],
            ],
        ];
    }

    /**
     * Flatten the structured template into row inserts for cnsd_transmitter_meter_items.
     */
    public static function buildItemRows(int $recordId, bool $erOnly = false): array
    {
        $rows = [];
        $sortOrder = 0;
        $now = now();

        foreach (self::sections($erOnly) as $section) {
            foreach ($section['groups'] as $group) {
                // Add group header row
                if ($section['code'] === '1' || $section['inputs_layout'] === 'receiver') {
                    $rows[] = [
                        'transmitter_meter_record_id' => $recordId,
                        'section_code'    => $section['code'],
                        'section_name'    => $section['name'],
                        'group_number'    => $group['number'],
                        'group_name'      => $group['name'],
                        'frequency_label' => null,
                        'merk'            => null,
                        'tx_label'        => null,
                        'status_value'    => null,
                        'power_output'    => null,
                        'modulasi'        => null,
                        'keterangan'      => null,
                        'status_a'        => null,
                        'status_b'        => null,
                        'squelch_tx1'     => null,
                        'squelch_tx2'     => null,
                        'nominal'         => null,
                        'hasil'           => null,
                        'is_header'       => true,
                        'is_blocked'      => false,
                        'block_reason'    => null,
                        'sort_order'      => $sortOrder++,
                        'created_at'      => $now,
                        'updated_at'      => $now,
                    ];
                }

                foreach ($group['items'] as $item) {
                    if ($section['code'] === '1') {
                        // Transmitter item
                        $isBlocked = ($item['status_type'] ?? '') === 'blocked';
                        $rows[] = [
                            'transmitter_meter_record_id' => $recordId,
                            'section_code'    => $section['code'],
                            'section_name'    => $section['name'],
                            'group_number'    => $group['number'],
                            'group_name'      => $group['name'],
                            'frequency_label' => $item['frequency_label'] ?? null,
                            'merk'            => $item['merk'] ?? null,
                            'tx_label'        => $item['tx_label'] ?? null,
                            'status_value'    => null,
                            'power_output'    => null,
                            'modulasi'        => null,
                            'keterangan'      => null,
                            'status_a'        => null,
                            'status_b'        => null,
                            'squelch_tx1'     => null,
                            'squelch_tx2'     => null,
                            'nominal'         => null,
                            'hasil'           => null,
                            'is_header'       => false,
                            'is_blocked'      => $isBlocked,
                            'block_reason'    => $isBlocked ? 'Status disabled per form resmi' : null,
                            'sort_order'      => $sortOrder++,
                            'created_at'      => $now,
                            'updated_at'      => $now,
                        ];
                    } elseif ($section['inputs_layout'] === 'receiver') {
                        // Receiver item
                        $rows[] = [
                            'transmitter_meter_record_id' => $recordId,
                            'section_code'    => $section['code'],
                            'section_name'    => $section['name'],
                            'group_number'    => $group['number'],
                            'group_name'      => $group['name'],
                            'frequency_label' => $item['frequency_label'] ?? null,
                            'merk'            => null,
                            'tx_label'        => null,
                            'status_value'    => null,
                            'power_output'    => null,
                            'modulasi'        => null,
                            'keterangan'      => null,
                            'status_a'        => null,
                            'status_b'        => null,
                            'squelch_tx1'     => null,
                            'squelch_tx2'     => null,
                            'nominal'         => null,
                            'hasil'           => null,
                            'is_header'       => false,
                            'is_blocked'      => false,
                            'block_reason'    => null,
                            'sort_order'      => $sortOrder++,
                            'created_at'      => $now,
                            'updated_at'      => $now,
                        ];
                    } else {
                        // Environment item (kegiatan text goes into frequency_label column)
                        $rows[] = [
                            'transmitter_meter_record_id' => $recordId,
                            'section_code'    => $section['code'],
                            'section_name'    => $section['name'],
                            'group_number'    => $group['number'],
                            'group_name'      => $group['name'],
                            'frequency_label' => $item['kegiatan'] ?? null,
                            'merk'            => null,
                            'tx_label'        => null,
                            'status_value'    => null,
                            'power_output'    => null,
                            'modulasi'        => null,
                            'keterangan'      => null,
                            'status_a'        => null,
                            'status_b'        => null,
                            'squelch_tx1'     => null,
                            'squelch_tx2'     => null,
                            'nominal'         => $item['nominal'] ?? null,
                            'hasil'           => null,
                            'is_header'       => false,
                            'is_blocked'      => false,
                            'block_reason'    => null,
                            'sort_order'      => $sortOrder++,
                            'created_at'      => $now,
                            'updated_at'      => $now,
                        ];
                    }
                }
            }
        }

        return $rows;
    }

    /**
     * Section + group metadata for frontend rendering.
     */
    public static function sectionMeta(bool $erOnly = false): array
    {
        return array_map(static function ($section) {
            return [
                'code'          => $section['code'],
                'name'          => $section['name'],
                'inputs_layout' => $section['inputs_layout'] ?? 'transmitter',
                'groups'        => array_map(static function ($g) {
                    return [
                        'number' => $g['number'] ?? null,
                        'name'   => $g['name']   ?? null,
                    ];
                }, $section['groups']),
            ];
        }, self::sections($erOnly));
    }
}
