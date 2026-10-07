<?php

namespace App\Services\Statistics;

use App\Services\Dashboard\DashboardModuleRegistry;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * GroundCheckStatisticsService — yearly recap + monthly measurement trends for
 * the five Ground Check modules (ADC, VHF, Localizer, Glide Path, DVOR).
 *
 * ## Why this looks different from TfpParameterStatisticsService
 *
 * TFP measurements live in a free-text jsonb map, so that service has to parse
 * strings and trim outliers. Ground Check measurements are already typed
 * `decimal(10,4)` columns, so:
 *
 *   - no string parsing is needed beyond casting;
 *   - readings are NOT trimmed. A DVOR error of 4° or an RF level far from the
 *     others is exactly the kind of drift an operator needs to see, so every
 *     stored reading is counted and min/max stay honest. Trimming here would
 *     silently hide the fault the statistics page exists to reveal.
 *
 * Only three of the five modules store numeric readings:
 *
 *   - gc-dvor → ground_check_dvor_bearing_points  (per 15° bearing)
 *   - gc-llz  → ground_check_llz_curve_points     (per jarak/side)
 *   - gc-adc, gc-vhf, gc-gp → items are free text only (dropdowns, ✓, and the
 *     `*_in_tolerance` / `*_out_of_tolerance` text columns), so those modules
 *     report the completion trend and carry no measurement series.
 *
 * Only `status = 'completed'` records are aggregated — a signature-approved
 * reading is the only one that counts as a measurement.
 */
class GroundCheckStatisticsService
{
    private const GC_GROUP = 'Ground Check';

    private const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    /**
     * Per-module metric catalogue. A module absent from this map has no numeric
     * measurements and therefore no series.
     *
     * `'angular' => true` marks a metric whose unit is a full 360° circle, so a
     * stored value like 359.4 is re-read as -0.6. See normaliseAngular().
     *
     * ADC / VHF / GP store measurements as free-text strings in items tables.
     * The service parses them via toNumber() (handles Indonesian decimal comma).
     * GP "Nav Analyzer" values live in a separate table (ground_check_gp_nav_items).
     */
    private const METRICS = [
        'gc-dvor' => [
            'source' => [
                'table' => 'ground_check_dvor_bearing_points',
                'fk' => 'ground_check_dvor_record_id',
                'records' => 'ground_check_dvor_records',
            ],
            'metrics' => [
                ['key' => 'tx1_error',   'label' => 'Error TX 1',    'unit' => '°', 'angular' => true],
                ['key' => 'tx2_error',   'label' => 'Error TX 2',    'unit' => '°', 'angular' => true],
                ['key' => 'tx1_reading', 'label' => 'Reading TX 1',  'unit' => '°'],
                ['key' => 'tx2_reading', 'label' => 'Reading TX 2',  'unit' => '°'],
            ],
        ],

        'gc-llz' => [
            'source' => [
                'table' => 'ground_check_llz_curve_points',
                'fk' => 'ground_check_llz_record_id',
                'records' => 'ground_check_llz_records',
            ],
            'metrics' => [
                ['key' => 'tx1_ddm_pct',    'label' => 'DDM (%) TX 1',    'unit' => '%'],
                ['key' => 'tx2_ddm_pct',    'label' => 'DDM (%) TX 2',    'unit' => '%'],
                ['key' => 'tx1_ddm_ua',     'label' => 'DDM (µA) TX 1',   'unit' => 'µA'],
                ['key' => 'tx2_ddm_ua',     'label' => 'DDM (µA) TX 2',   'unit' => 'µA'],
                ['key' => 'tx1_sum_pct',    'label' => 'SUM (%) TX 1',    'unit' => '%'],
                ['key' => 'tx2_sum_pct',    'label' => 'SUM (%) TX 2',    'unit' => '%'],
                ['key' => 'tx1_mod_90hz',   'label' => 'MOD 90 Hz TX 1',  'unit' => '%'],
                ['key' => 'tx2_mod_90hz',   'label' => 'MOD 90 Hz TX 2',  'unit' => '%'],
                ['key' => 'tx1_mod_150hz',  'label' => 'MOD 150 Hz TX 1', 'unit' => '%'],
                ['key' => 'tx2_mod_150hz',  'label' => 'MOD 150 Hz TX 2', 'unit' => '%'],
                ['key' => 'tx1_rf_level_db', 'label' => 'RF Level TX 1',  'unit' => 'dB'],
                ['key' => 'tx2_rf_level_db', 'label' => 'RF Level TX 2',  'unit' => '%'],
            ],
        ],

        // ADC & VHF: power readings from items table (tx1_hasil_pd / tx2_hasil_pd)
        'gc-adc' => [
            'source' => [
                'table' => 'ground_check_adc_items',
                'fk' => 'ground_check_adc_record_id',
                'records' => 'ground_check_adc_records',
            ],
            'metrics' => [
                ['key' => 'tx1_hasil_pd', 'label' => 'Power TX 1', 'unit' => 'W'],
                ['key' => 'tx2_hasil_pd', 'label' => 'Power TX 2', 'unit' => 'W'],
            ],
        ],

        'gc-vhf' => [
            'source' => [
                'table' => 'ground_check_vhf_items',
                'fk' => 'ground_check_vhf_record_id',
                'records' => 'ground_check_vhf_records',
            ],
            'metrics' => [
                ['key' => 'tx1_hasil_pd', 'label' => 'Power TX 1', 'unit' => 'W'],
                ['key' => 'tx2_hasil_pd', 'label' => 'Power TX 2', 'unit' => 'W'],
            ],
        ],

        // GP: Nav Analyzer readings from dedicated table
        'gc-gp' => [
            'source' => [
                'table' => 'ground_check_gp_nav_items',
                'fk' => 'ground_check_gp_record_id',
                'records' => 'ground_check_gp_records',
            ],
            'metrics' => [
                ['key' => 'tx1_value', 'label' => 'Nav Analyzer TX 1', 'unit' => ''],
                ['key' => 'tx2_value', 'label' => 'Nav Analyzer TX 2', 'unit' => ''],
            ],
        ],
    ];

    /**
     * Yearly recap for all five Ground Check modules — the equipment picker on
     * /statistics/ground-check.
     *
     * @return array{year: int, modules: array<int, array<string, mixed>>}
     */
    public function moduleIndex(int $year): array
    {
        $modules = [];

        foreach (self::groundCheckModules() as $module) {
            $rows = $module['model']::query()
                ->selectRaw(
                    'EXTRACT(MONTH FROM date)::int AS month,'.
                    ' count(*) AS total,'.
                    " count(*) FILTER (WHERE status = 'completed') AS completed,".
                    ' max(date) AS last_date'
                )
                ->whereYear('date', $year)
                ->groupBy('month')
                ->get();

            $monthlyCompleted = array_fill(0, 12, 0);
            $monthlyTotal = array_fill(0, 12, 0);
            $totalRecords = 0;
            $completedRecords = 0;
            $lastDate = null;

            foreach ($rows as $row) {
                $idx = (int) $row->month - 1;
                if ($idx < 0 || $idx > 11) {
                    continue;
                }
                $monthlyTotal[$idx] = (int) $row->total;
                $monthlyCompleted[$idx] = (int) $row->completed;
                $totalRecords += (int) $row->total;
                $completedRecords += (int) $row->completed;

                $rowLast = substr((string) $row->last_date, 0, 10);
                if ($rowLast !== '' && ($lastDate === null || $rowLast > $lastDate)) {
                    $lastDate = $rowLast;
                }
            }

            $metricCount = count(self::metricSpec($module['key'])['metrics'] ?? []);

            $modules[] = [
                'module_key' => $module['key'],
                'label' => $module['label'],
                'route' => $module['route'],
                'total_records' => $totalRecords,
                'completed_records' => $completedRecords,
                'completion_rate' => $totalRecords > 0 ? round($completedRecords / $totalRecords * 100, 1) : 0.0,
                'monthly_total' => $monthlyTotal,
                'monthly_completed' => $monthlyCompleted,
                'last_date' => $lastDate,
                // The picker shows this so an operator knows up front which
                // modules carry a measurement chart and which are recap-only.
                'has_numeric' => $metricCount > 0,
                'metric_count' => $metricCount,
            ];
        }

        return ['year' => $year, 'modules' => $modules];
    }

    /**
     * One module: yearly recap + completion trend + the measurement metrics
     * found for the year + the min/max/avg series for the requested metric.
     *
     * The metric is optional — without it you get the summary and the metric
     * list, which is what the picker needs to fill its dropdown.
     *
     * @return array<string, mixed>
     */
    public function module(string $moduleKey, int $year, ?string $metricKey = null): array
    {
        $module = self::findModule($moduleKey);

        if ($module === null) {
            abort(404, 'Modul Ground Check tidak ditemukan.');
        }

        $monthlyTotal = array_fill(0, 12, 0);
        $monthlyCompleted = array_fill(0, 12, 0);
        $statusCounts = ['ongoing' => 0, 'on_hold' => 0, 'completed' => 0];
        $lastDate = null;

        $records = $module['model']::query()
            ->whereYear('date', $year)
            ->orderBy('date')
            ->get(['date', 'status']);

        foreach ($records as $record) {
            $date = $record->date;
            $monthIdx = (int) $date->month - 1;
            $iso = substr((string) $date, 0, 10);

            if ($monthIdx >= 0 && $monthIdx <= 11) {
                $monthlyTotal[$monthIdx]++;
                if ($record->status === 'completed') {
                    $monthlyCompleted[$monthIdx]++;
                }
            }
            if ($record->status !== null && array_key_exists($record->status, $statusCounts)) {
                $statusCounts[$record->status]++;
            }
            if ($iso !== '' && ($lastDate === null || $iso > $lastDate)) {
                $lastDate = $iso;
            }
        }

        $spec = self::metricSpec($moduleKey);
        $collected = $spec === null ? [] : $this->collectMetrics($spec, $year);

        $availableMetrics = array_map(static fn (array $m): array => [
            'metric_key' => $m['metric_key'],
            'label' => $m['label'],
            'unit' => $m['unit'],
            'samples' => $m['samples'],
            'normalized' => $m['normalized'],
        ], $collected);

        $series = $this->emptySeries();

        if ($metricKey !== null) {
            foreach ($collected as $metric) {
                if ($metric['metric_key'] !== $metricKey) {
                    continue;
                }
                $series['metric_key'] = $metric['metric_key'];
                $series['label'] = $metric['label'];
                $series['unit'] = $metric['unit'];
                $series['total_samples'] = $metric['samples'];
                $series['normalized_samples'] = $metric['normalized'];
                $series['points'] = $metric['monthly'];
                break;
            }
        }

        $completedTotal = array_sum($monthlyCompleted);
        $recordsTotal = array_sum($monthlyTotal);

        return [
            'year' => $year,
            'module_key' => $module['key'],
            'label' => $module['label'],
            'route' => $module['route'],
            'records_total' => $recordsTotal,
            'records_completed' => $completedTotal,
            'completion_rate' => $recordsTotal > 0 ? round($completedTotal / $recordsTotal * 100, 1) : 0.0,
            'monthly_total' => $monthlyTotal,
            'monthly_completed' => $monthlyCompleted,
            'status_counts' => $statusCounts,
            'last_date' => $lastDate,
            'has_numeric' => $spec !== null,
            'available_metrics' => $availableMetrics,
            'series' => $series,
        ];
    }

    /**
     * Read every declared metric column in one pass and bucket it per month.
     *
     * @param  array{source: array{table: string, fk: string, records: string}, metrics: array<int, array{key: string, label: string, unit: string, angular?: bool}>}  $spec
     * @return array<int, array{metric_key: string, label: string, unit: string, samples: int, normalized: int, monthly: array<int, array<string, mixed>>}>
     */
    private function collectMetrics(array $spec, int $year): array
    {
        $source = $spec['source'];
        $metricKeys = array_column($spec['metrics'], 'key');

        // metricKey => is this column an angle that needs 360° wrap normalisation?
        $angular = array_fill_keys($metricKeys, false);
        $parseAsNumber = array_fill_keys($metricKeys, false);
        foreach ($spec['metrics'] as $metric) {
            $angular[$metric['key']] = (bool) ($metric['angular'] ?? false);
            $parseAsNumber[$metric['key']] = true; // ADC/VHF/GP stored as strings
        }

        $select = [$source['records'].'.date as gc_date'];
        foreach ($metricKeys as $key) {
            $select[] = $source['table'].'.'.$key;
        }

        $rows = DB::table($source['table'])
            ->join(
                $source['records'],
                $source['records'].'.id',
                '=',
                $source['table'].'.'.$source['fk']
            )
            ->whereNull($source['records'].'.deleted_at')
            ->where($source['records'].'.status', 'completed')
            ->whereYear($source['records'].'.date', $year)
            ->get($select);

        /** metricKey => monthIdx => running counter/min/max */
        $buckets = [];
        $normalized = array_fill_keys($metricKeys, 0);
        foreach ($metricKeys as $key) {
            $buckets[$key] = array_fill(0, 12, ['count' => 0, 'sum' => 0.0, 'min' => null, 'max' => null]);
        }

        foreach ($rows as $row) {
            $monthIdx = (int) Carbon::parse($row->gc_date)->month - 1;
            if ($monthIdx < 0 || $monthIdx > 11) {
                continue;
            }

            foreach ($metricKeys as $key) {
                $raw = $row->{$key} ?? null;
                if ($raw === null) {
                    continue;
                }

                $value = $parseAsNumber[$key] ? self::toNumber($raw) : (float) $raw;
                if ($value === null) {
                    continue;
                }
                if ($angular[$key] && ($normalised = self::normaliseAngular($value)) !== $value) {
                    $normalized[$key]++;
                    $value = $normalised;
                }

                $bucket = &$buckets[$key][$monthIdx];
                $bucket['count']++;
                $bucket['sum'] += $value;
                if ($bucket['min'] === null || $value < $bucket['min']) {
                    $bucket['min'] = $value;
                }
                if ($bucket['max'] === null || $value > $bucket['max']) {
                    $bucket['max'] = $value;
                }
                unset($bucket);
            }
        }

        $out = [];
        foreach ($spec['metrics'] as $metric) {
            $key = $metric['key'];

            $samples = 0;
            foreach ($buckets[$key] as $bucket) {
                $samples += $bucket['count'];
            }

            $monthly = [];
            for ($m = 0; $m < 12; $m++) {
                $bucket = $buckets[$key][$m];
                $count = $bucket['count'];

                // Months with no reading report nulls, not zeros, so the chart
                // draws a gap instead of a fake data point at zero.
                $monthly[] = [
                    'month' => $m + 1,
                    'label' => self::MONTH_LABELS[$m],
                    'count' => $count,
                    'min' => $count > 0 ? round($bucket['min'], 4) : null,
                    'max' => $count > 0 ? round($bucket['max'], 4) : null,
                    'avg' => $count > 0 ? round($bucket['sum'] / $count, 4) : null,
                ];
            }

            $out[] = [
                'metric_key' => $key,
                'label' => $metric['label'],
                'unit' => $metric['unit'],
                'samples' => $samples,
                'normalized' => $normalized[$key],
                'monthly' => $monthly,
            ];
        }

        return $out;
    }

    /**
     * Re-express a full-circle angle in (-180, 180].
     *
     * DVOR error is stored as a plain `bearing - reading` subtraction with no
     * wrap handling, so a reading taken at the 0°/360° edge is persisted the
     * long way round: bearing 360 with a 0.6000 reading stores 359.4 instead of
     * -0.6. Left alone that single row drags a month's average from about -0.33
     * to 14.13 and pins max at 359.4, which reads as a violent antenna fault
     * when the equipment is fine.
     *
     * This is a read-side correction only — no stored value is rewritten, and
     * the number of readings it touched is reported as `normalized` so the
     * chart can say so out loud rather than quietly cleaning the data.
     */
    private static function normaliseAngular(float $value): float
    {
        return $value - 360 * floor(($value + 180) / 360);
    }

    /**
     * Normalise a stored reading string to a float, or null when not a number.
     *
     * Handles "-" and "" (empty cells), strips thousands separators, and
     * treats a lone comma as the Indonesian decimal mark ("220,5" → 220.5).
     * Mirrors TfpParameterStatisticsService::toNumber().
     */
    private static function toNumber(mixed $raw): ?float
    {
        if (is_int($raw) || is_float($raw)) {
            $value = (float) $raw;

            return is_finite($value) ? $value : null;
        }

        if (! is_string($raw)) {
            return null;
        }

        $clean = trim($raw);
        if ($clean === '' || $clean === '-' || $clean === '—') {
            return null;
        }

        // "1.234,5" → "1234.5"  ·  "1,234.5" → "1234.5"  ·  "220,5" → "220.5"
        if (str_contains($clean, ',') && str_contains($clean, '.')) {
            $clean = str_replace(',', '', $clean);
        } elseif (str_contains($clean, ',') && ! str_contains($clean, '.')) {
            $clean = str_replace(',', '.', $clean);
        }

        $clean = str_replace([' ', '_'], '', $clean);

        return is_numeric($clean) ? (float) $clean : null;
    }

    /**
     * 12-month null skeleton, used when no metric was requested or matched.
     *
     * @return array<string, mixed>
     */
    private function emptySeries(): array
    {
        $points = [];
        for ($m = 1; $m <= 12; $m++) {
            $points[] = [
                'month' => $m,
                'label' => self::MONTH_LABELS[$m - 1],
                'count' => 0,
                'min' => null,
                'max' => null,
                'avg' => null,
            ];
        }

        return [
            'metric_key' => null,
            'label' => null,
            'unit' => null,
            'total_samples' => 0,
            'normalized_samples' => 0,
            'points' => $points,
        ];
    }

    /**
     * @return array{source: array{table: string, fk: string, records: string}, metrics: array<int, array{key: string, label: string, unit: string}>}|null
     */
    private static function metricSpec(string $moduleKey): ?array
    {
        return self::METRICS[$moduleKey] ?? null;
    }

    /** All Ground Check modules, in registry order. */
    private static function groundCheckModules(): array
    {
        return array_values(array_filter(
            DashboardModuleRegistry::modules(),
            static fn (array $module): bool => $module['group'] === self::GC_GROUP
        ));
    }

    private static function findModule(string $key): ?array
    {
        foreach (self::groundCheckModules() as $module) {
            if ($module['key'] === $key) {
                return $module;
            }
        }

        return null;
    }
}
