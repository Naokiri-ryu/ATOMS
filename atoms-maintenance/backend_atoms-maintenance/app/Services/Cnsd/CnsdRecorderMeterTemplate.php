<?php

namespace App\Services\Cnsd;

/**
 * CnsdRecorderMeterTemplate — canonical Recorder Meter Reading item list,
 * mirrored from the official "METER READING — RECORDER" paper form
 * (FORM C-3) used by AirNav Surabaya.
 *
 * The backend uses this template at create-time to seed
 * cnsd_recorder_meter_items for every new Recorder record. Users only fill in
 * technical readings — they never define items themselves.
 *
 * Form structure (per the reference image):
 *
 *   Section A — PERALATAN
 *     Group 1: KVM         (All Status Indikator)
 *     Group 2: SERVER      (Main Server, Standby server)
 *     Group 3: POWER       (AC, DC)
 *     Group 4: CHANNEL     (Channel 1 - 64, with U/S items where applicable)
 *
 *   Section B — LINGKUNGAN KERJA  (suhu, humidity, kebersihan)
 *
 * U/S (Un-Serviceable) channels:
 *   Some channels appear as red strips on the paper form with a "U/S" label
 *   (Channel 21-27, 29-35 partially; whole-channel blocks: 25, 27, 29-31, 33).
 *   Fully blocked channels are seeded with `is_blocked = true` and
 *   `block_reason = 'U/S'`. Frontend renders them as a red strip with all
 *   inputs disabled. Backend rejects any update payload targeting blocked rows.
 *
 * Per-server lock:
 *   Channels 21-35 may have a fixed "U/S" on one of Server A / Server B while
 *   the other server stays editable. Locked cells are seeded with
 *   `hasil_server_a`/`hasil_server_b` = 'U/S' plus `server_a_locked` /
 *   `server_b_locked` = true. Frontend renders them disabled, backend ignores
 *   writes to locked cells. The paper form's "OK" cells are left empty for the
 *   technician to check themselves.
 *
 * Nominal values seeded from the form (column NOMINAL):
 *   - "Normal / Alrm"  → KVM (dropdown Normal / Alrm)
 *   - "√ / -"          → SERVER (dropdown √ / -)
 *   - null             → POWER (manual input — no nominal on form)
 *   - "<channel name>" → CHANNEL (dropdown Normal / Fault per channel)
 *   - "< 22° C"        → environment temperature (manual input)
 *   - "√"              → environment humidity & cleanliness (dropdown √ / -)
 */
class CnsdRecorderMeterTemplate
{
    /**
     * Section + group + item structure for the Recorder Meter Reading form.
     *
     * Item shape:
     *   - section_code   : 'A' or 'B' (alphabet header on paper form)
     *   - section_name   : full section name
     *   - group_number   : optional sub-grouping inside the section (1–4 in A)
     *   - group_name     : optional sub-grouping label
     *   - item_number    : visible numbering on paper (e.g. "Channel 7")
     *   - item_name      : display label
     *   - nominal        : threshold / expected value from the paper form
     *   - is_blocked     : true for U/S items (rendered red, inputs disabled)
     *   - block_reason   : "U/S" for blocked items
     */
    public static function sections(): array
    {
        return [
            // ───────────────────────────────────────────────────────────
            // SECTION A — PERALATAN
            // Inputs: Server A + Server B columns (hasil_server_a / b)
            // ───────────────────────────────────────────────────────────
            [
                'code'            => 'A',
                'name'            => 'PERALATAN',
                'inputs_layout'   => 'server_dual',
                'columns_label_1' => 'Server A',
                'columns_label_2' => 'Server B',
                'groups' => [
                    [
                        'number' => 1,
                        'name'   => 'KVM',
                        'items'  => [
                            ['item_number' => '', 'item_name' => 'All Status Indikator', 'nominal' => 'Normal / Alrm'],
                        ],
                    ],
                    [
                        'number' => 2,
                        'name'   => 'SERVER',
                        'items'  => [
                            ['item_number' => '', 'item_name' => 'Main Server',    'nominal' => '√ / -'],
                            ['item_number' => '', 'item_name' => 'Standby server', 'nominal' => '√ / -'],
                        ],
                    ],
                    [
                        'number' => 3,
                        'name'   => 'POWER',
                        'items'  => [
                            ['item_number' => '', 'item_name' => 'AC', 'nominal' => null],
                            ['item_number' => '', 'item_name' => 'DC', 'nominal' => null],
                        ],
                    ],
                    [
                        'number' => 4,
                        'name'   => 'CHANNEL',
                        'items'  => self::channelItems(),
                    ],
                ],
            ],

            // ───────────────────────────────────────────────────────────
            // SECTION B — LINGKUNGAN KERJA
            // Inputs: NOMINAL | HASIL PEMERIKSAAN | KETERANGAN
            // ───────────────────────────────────────────────────────────
            [
                'code'            => 'B',
                'name'            => 'LINGKUNGAN KERJA',
                'inputs_layout'   => 'environment',
                'columns_label_1' => 'HASIL PEMERIKSAAN',
                'columns_label_2' => null,
                'groups' => [
                    [
                        'number' => null,
                        'name'   => null,
                        'items'  => [
                            ['item_number' => '1', 'item_name' => 'PEMERIKSAAN SUHU RUANGAN',      'nominal' => '< 22° C'],
                            ['item_number' => '2', 'item_name' => 'PEMERIKSAAN AIR HUMIDITY',      'nominal' => '√'],
                            ['item_number' => '3', 'item_name' => 'PEMERIKSAAN KEBERSIHAN RUANGAN', 'nominal' => '√'],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Channel 1 - 64 list, mirroring the paper form. Channels marked U/S in
     * the reference image are seeded with is_blocked = true.
     *
     * Channel map value forms:
     *   - string          → serviceable channel, both servers editable; value = content
     *   - null            → fully U/S (is_blocked = true, block_reason = 'U/S')
     *   - array           → serviceable channel with per-server status:
     *                       ['content' => '...', 'server_a' => 'OK'|'U/S', 'server_b' => 'OK'|'U/S']
     *     'U/S' on a server → that cell is seeded 'U/S' and locked (not editable);
     *     'OK'             → cell left empty, technician fills/checks it.
     *
     * Channel header on paper form:
     *   NOMINAL = "Content" (e.g. "Ground Primary")
     *   HASIL   = Normal / Fault (dropdown on FE)
     */
    private static function channelItems(): array
    {
        // Map of channel number → content / status (see docblock above).
        // Channel 21-27, 29-35 carry per-server status; 25, 27, 29-31, 33 stay U/S.
        $channels = [
            1  => 'Ground Primary',
            2  => 'Ground Secondary',
            3  => 'Tower Primary',
            4  => 'Tower Secondary',
            5  => 'Director Primary',
            6  => 'Director Secondary',
            7  => 'Spare',                   // serviceable (spare channel)
            8  => 'East Primary',
            9  => 'West Primary',
            10 => 'West Secondary',
            11 => 'Blora Primary 125.1 MHz',
            12 => 'DS DHOHO KEDIRI',
            13 => 'MKS-ER Primary',
            14 => 'MKS-ER Secondary',
            15 => 'ATIS',
            16 => 'EMERGENCY',
            17 => 'CDU FUNKE',
            18 => 'CDU Primary',
            19 => 'CDU Secondary',
            20 => 'Blora Secondary',
            // Channels 21-35 carry per-server status. Array form:
            //   ['content' => <column>', 'server_a' => 'OK'|'U/S', 'server_b' => 'OK'|'U/S']
            //   null = fully U/S (whole-channel block).
            21 => ['content' => 'DS UPN PKN',     'server_a' => 'OK', 'server_b' => 'OK'],
            22 => ['content' => 'DS Banjarmasin', 'server_a' => 'U/S', 'server_b' => 'OK'],
            23 => ['content' => 'Spare',          'server_a' => 'OK', 'server_b' => 'OK'],
            24 => ['content' => '',                 'server_a' => 'U/S', 'server_b' => 'OK'],
            25 => null,                      // U/S semua
            26 => ['content' => '',                 'server_a' => 'U/S', 'server_b' => 'OK'],
            27 => null,                      // U/S semua
            28 => ['content' => 'DS Jogja',       'server_a' => 'OK', 'server_b' => 'U/S'],
            29 => null,                      // U/S semua
            30 => null,                      // U/S semua
            31 => null,                      // U/S semua
            32 => ['content' => 'DS Madiun',      'server_a' => 'OK', 'server_b' => 'OK'],
            33 => null,                      // U/S semua
            34 => ['content' => '',                 'server_a' => 'U/S', 'server_b' => 'OK'],
            35 => ['content' => '',                 'server_a' => 'U/S', 'server_b' => 'OK'],
            36 => 'Telp TOWER 581',
            37 => 'Telp TOWER 110',
            38 => 'Telp APP 597',
            39 => ['content' => 'Telp APP 8655223', 'server_a' => 'U/S', 'server_b' => 'U/S'], // nama dipertahankan, kedua server U/S
            40 => 'TRUNKING TOWER',
            41 => 'Frequentis Control Tower',
            42 => 'Frequentis Ass Tower',
            43 => 'Frequentis Control GND',
            44 => 'Frequentis Control CDU',
            45 => 'Frequentis Control Direct',
            46 => 'Frequentis East Asst',
            47 => 'Frequentis West Asst',
            48 => 'Frequentis West Controller',
            49 => 'Frequentis Director Control',
            50 => 'Frequentis Director Asst',
            51 => 'Frequentis Supervisor APP',
            52 => null,                      // U/S penuh — nama kosong
            53 => ['content' => 'DS Pangkalanbun',  'server_a' => 'U/S', 'server_b' => 'OK'],
            54 => 'DS JAKARTA',
            55 => 'DS MKS- EAST',
            56 => ['content' => 'DS MKS-WEST',       'server_a' => 'OK', 'server_b' => 'U/S'],
            57 => 'DS BALI',
            58 => 'DS SEMARANG',
            59 => 'DS BALI INFO',
            60 => 'DS MALANG',
            61 => 'DS YIA',
            62 => ['content' => '',                 'server_a' => 'U/S', 'server_b' => 'U/S'],
            63 => 'EAST SECONDARY',
            64 => ['content' => '',                 'server_a' => 'U/S', 'server_b' => 'U/S'],
        ];

        $items = [];
        foreach ($channels as $num => $content) {
            if ($content === null) {
                $items[] = [
                    'item_number'   => 'Channel ' . $num,
                    'item_name'     => 'Channel ' . $num,
                    'nominal'       => null,
                    'is_blocked'    => true,
                    'block_reason'  => 'U/S',
                    'server_a_lock' => false,
                    'server_b_lock' => false,
                ];
                continue;
            }

            if (is_array($content)) {
                $items[] = [
                    'item_number'   => 'Channel ' . $num,
                    'item_name'     => 'Channel ' . $num,
                    'nominal'       => $content['content'],
                    'is_blocked'    => false,
                    'server_a_lock' => $content['server_a'] === 'U/S',
                    'server_b_lock' => $content['server_b'] === 'U/S',
                ];
                continue;
            }

            $items[] = [
                'item_number'   => 'Channel ' . $num,
                'item_name'     => 'Channel ' . $num,
                'nominal'       => $content,
                'is_blocked'    => false,
                'server_a_lock' => false,
                'server_b_lock' => false,
            ];
        }

        return $items;
    }

    /**
     * Flatten the structured template into row inserts for cnsd_recorder_meter_items.
     */
    public static function buildItemRows(int $recordId): array
    {
        $rows = [];
        $sortOrder = 0;
        $now = now();

        foreach (self::sections() as $section) {
            foreach ($section['groups'] as $group) {
                foreach ($group['items'] as $item) {
                    $serverALock = $item['server_a_lock'] ?? false;
                    $serverBLock = $item['server_b_lock'] ?? false;
                    $rows[] = [
                        'recorder_meter_record_id' => $recordId,
                        'section_code'             => $section['code'],
                        'section_name'             => $section['name'],
                        'group_number'             => $group['number'] ?? null,
                        'group_name'               => $group['name']   ?? null,
                        'item_number'              => $item['item_number'] ?? null,
                        'item_name'                => $item['item_name'],
                        'nominal'                  => $item['nominal']    ?? null,
                        'hasil_server_a'           => $serverALock ? 'U/S' : null,
                        'hasil_server_b'           => $serverBLock ? 'U/S' : null,
                        'hasil'                    => null,
                        'keterangan'               => null,
                        'is_blocked'               => $item['is_blocked'] ?? false,
                        'block_reason'             => $item['block_reason'] ?? null,
                        'server_a_locked'          => $serverALock,
                        'server_b_locked'          => $serverBLock,
                        'sort_order'               => $sortOrder++,
                        'created_at'               => $now,
                        'updated_at'               => $now,
                    ];
                }
            }
        }

        return $rows;
    }

    /**
     * Section + group metadata (without items) — used by the frontend to render
     * tabs/accordions and the right column headers per section.
     */
    public static function sectionMeta(): array
    {
        return array_map(static function ($section) {
            return [
                'code'            => $section['code'],
                'name'            => $section['name'],
                'inputs_layout'   => $section['inputs_layout'] ?? 'server_dual',
                'columns_label_1' => $section['columns_label_1'] ?? null,
                'columns_label_2' => $section['columns_label_2'] ?? null,
                'groups'          => array_map(static function ($g) {
                    return [
                        'number' => $g['number'] ?? null,
                        'name'   => $g['name']   ?? null,
                    ];
                }, $section['groups']),
            ];
        }, self::sections());
    }
}
