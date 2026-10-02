<?php

namespace App\Services\Statistics;

use App\Services\Dashboard\DashboardModuleRegistry;

/**
 * TfpParameterStatisticsService — per-equipment statistics for the TFP
 * Performance Check modules, powering the /statistics page (which lists the
 * 10 equipment and drills into one of them).
 *
 * Why this is aggregated in PHP and not in SQL: every measurement lives in
 * `items.values` as a FLAT jsonb map whose keys are cell references built from
 * the record's own `columns_config`:
 *
 *   {"panel_rd01.value":"226","ups_topaz.input":"230","panel_cos_rd03.output":"231"}
 *
 * Three consequences drive the design:
 *
 *  1. The cell keys are NOT stable per equipment — `columns_config` differs
 *     between records (the Radar template declares 9 panels, recent records
 *     only carry 7). So the list of available measurement points is discovered
 *     from the data instead of from the template.
 *  2. Values are free text. Empty cells are stored as "-", and operators type
 *     "220,5" as often as "220.5". `toNumber()` normalises and rejects the rest.
 *  3. A single cell key can repeat across rows: the Genset forms carry three
 *     distinct items under parameter_number 17 (V R-N / V S-N / V T-N) that all
 *     write to "value.value". A measurement point is therefore identified by
 *     the (parameter_number, parameter_name, cell_key) triple — see `point_id`.
 *
 * Typing errors do slip into the paper forms (a "29" instead of "229" on Radar,
 * a "396" inside a 218-234 band on AOB Ground). Left alone they would drag the
 * min/max range across two orders of magnitude and flatten the average line, so
 * each point's samples are first trimmed against a band derived from the
 * point's own median (see the OUTLIER_* constants) before aggregating. The
 * discarded count is reported back as `samples_excluded` — never silently.
 *
 * Same "disetor" definition as StatisticsOverviewService: only records with
 * status = 'completed' (all required signatures present) are aggregated.
 */
class TfpParameterStatisticsService
{
    private const TFP_GROUP = 'TFP Performance';

    private const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    /** Emitted inside `point_id`; consumed as three separate query params. */
    private const POINT_ID_SEPARATOR = "\x1f";

    /** Readings below/above median x this are treated as suspect. */
    private const OUTLIER_LOW_RATIO = 0.5;
    private const OUTLIER_HIGH_RATIO = 1.5;

    /** Never trim more than this share of a point's samples. */
    private const OUTLIER_MAX_DROP_RATIO = 0.1;

    /**
     * Below this sample count the distribution is too thin to judge, so the
     * point is aggregated as-is rather than risk discarding real readings.
     */
    private const OUTLIER_MIN_SAMPLES = 8;

    /**
     * Every TFP Performance Check module, with its yearly recap.
     * Powers the equipment picker on /statistics.
     *
     * @return array{year: int, equipment: array<int, array<string, mixed>>}
     */
    public function equipmentIndex(int $year): array
    {
        $equipment = [];

        foreach (self::tfpModules() as $module) {
            $rows = $module['model']::query()
                ->selectRaw(
                    'EXTRACT(MONTH FROM date)::int AS month,' .
                    ' count(*) AS total,' .
                    " count(*) FILTER (WHERE status = 'completed') AS completed," .
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

            $equipment[] = [
                'module_key'        => $module['key'],
                'label'             => $module['label'],
                'route'             => $module['route'],
                'total_records'     => $totalRecords,
                'completed_records' => $completedRecords,
                'completion_rate'   => $totalRecords > 0 ? round($completedRecords / $totalRecords * 100, 1) : 0.0,
                'monthly_total'     => $monthlyTotal,
                'monthly_completed' => $monthlyCompleted,
                'last_date'         => $lastDate,
            ];
        }

        return ['year' => $year, 'equipment' => $equipment];
    }

    /**
     * One equipment: yearly recap + the list of measurement points found in
     * its data + the min/max/avg series for the requested point.
     *
     * Pointers are optional — without them you get the summary and the
     * available points, which is what the picker needs to fill its dropdown.
     *
     * @return array<string, mixed>
     */
    public function equipment(
        string $moduleKey,
        int $year,
        ?string $parameterNumber = null,
        ?string $parameterName = null,
        ?string $cellKey = null
    ): array {
        $module = self::findModule($moduleKey);

        if ($module === null) {
            abort(404, 'Modul TFP tidak ditemukan.');
        }

        $records = $module['model']::query()
            ->with('items')
            ->whereYear('date', $year)
            ->orderBy('date')
            ->get();

        $monthlyTotal = array_fill(0, 12, 0);
        $monthlyCompleted = array_fill(0, 12, 0);
        $statusCounts = ['ongoing' => 0, 'on_hold' => 0, 'completed' => 0];
        $lastDate = null;

        /** point_id => [meta..., 'raw' => list of [monthIdx, value]] */
        $points = [];

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

            // Only completed records carry signature-approved readings.
            if ($record->status !== 'completed') {
                continue;
            }

            $labels = self::cellLabels($record->columns_config);

            foreach ($record->items as $item) {
                $values = is_array($item->values) ? $item->values : [];
                if ($values === []) {
                    continue;
                }

                $number = (string) ($item->parameter_number ?? '');
                $name = (string) ($item->parameter_name ?? '');

                foreach ($values as $cell => $raw) {
                    $numeric = self::toNumber($raw);
                    if ($numeric === null || $monthIdx < 0 || $monthIdx > 11) {
                        continue;
                    }

                    $pointId = $number . self::POINT_ID_SEPARATOR . $name . self::POINT_ID_SEPARATOR . $cell;

                    if (! isset($points[$pointId])) {
                        $points[$pointId] = [
                            'point_id'         => $pointId,
                            'parameter_number' => $number,
                            'parameter_name'   => $name,
                            'unit'             => $item->unit,
                            'cell_key'         => (string) $cell,
                            'cell_label'       => $labels[(string) $cell] ?? self::humaniseCellKey((string) $cell),
                            'raw'              => [],
                        ];
                    }

                    $points[$pointId]['raw'][] = [$monthIdx, $numeric];
                }
            }
        }

        // Aggregate each point, trimming implausible readings first.
        $availablePoints = [];
        foreach ($points as $point) {
            $stats = self::aggregateSamples($point['raw']);
            unset($point['raw']);

            $availablePoints[] = $point + $stats;
        }

        // Order the dropdown the way the paper form is laid out: by panel, then
        // by row number. parameter_name only breaks ties, because the Genset
        // forms reuse one parameter_number (17) for V R-N / V S-N / V T-N.
        usort($availablePoints, static function (array $a, array $b): int {
            return [$a['cell_label'], (int) $a['parameter_number'], $a['parameter_name']]
                <=> [$b['cell_label'], (int) $b['parameter_number'], $b['parameter_name']];
        });

        $series = $this->emptySeries();

        if ($parameterNumber !== null && $parameterName !== null && $cellKey !== null) {
            $pointId = $parameterNumber . self::POINT_ID_SEPARATOR . $parameterName . self::POINT_ID_SEPARATOR . $cellKey;

            foreach ($availablePoints as $point) {
                if ($point['point_id'] !== $pointId) {
                    continue;
                }

                $series['parameter_number'] = $point['parameter_number'];
                $series['parameter_name'] = $point['parameter_name'];
                $series['unit'] = $point['unit'];
                $series['cell_key'] = $point['cell_key'];
                $series['cell_label'] = $point['cell_label'];
                $series['total_samples'] = $point['samples'];
                $series['samples_excluded'] = $point['samples_excluded'];
                $series['points'] = $point['monthly'];
                break;
            }
        }

        $completedTotal = array_sum($monthlyCompleted);
        $recordsTotal = array_sum($monthlyTotal);

        return [
            'year'              => $year,
            'module_key'        => $module['key'],
            'label'             => $module['label'],
            'route'             => $module['route'],
            'records_total'     => $recordsTotal,
            'records_completed' => $completedTotal,
            'completion_rate'   => $recordsTotal > 0 ? round($completedTotal / $recordsTotal * 100, 1) : 0.0,
            'monthly_total'     => $monthlyTotal,
            'monthly_completed' => $monthlyCompleted,
            'status_counts'     => $statusCounts,
            'last_date'         => $lastDate,
            'available_points'  => array_map(static fn (array $p): array => [
                'point_id'         => $p['point_id'],
                'parameter_number' => $p['parameter_number'],
                'parameter_name'   => $p['parameter_name'],
                'unit'             => $p['unit'],
                'cell_key'         => $p['cell_key'],
                'cell_label'       => $p['cell_label'],
                'samples'          => $p['samples'],
            ], $availablePoints),
            'series'            => $series,
        ];
    }

    /**
     * Trim the sample list, then bucket what survives per month. Months left
     * with no usable reading report nulls (not zero) so the chart draws a gap
     * instead of a fake data point.
     *
     * The rule is relative to the point's own median: readings outside
     * [median x 0.5, median x 1.5] are suspect. A median-relative band was
     * chosen over Tukey fences because IQR collapses to zero whenever a
     * reading is pinned (the Genset output sits on 222 almost every day), and
     * a zero-width box would flag the legitimate 230 mains readings as outliers.
     *
     * A relative band would happily shred a parameter that genuinely swings
     * (fuel use), so at most 10% of the samples may ever be dropped — if more
     * than that looks suspect the data is too varied to trim and is kept as-is.
     *
     * @param  array<int, array{0:int,1:float}>  $raw
     * @return array{samples:int, samples_excluded:int, monthly:array<int, array<string, mixed>>}
     */
    private static function aggregateSamples(array $raw): array
    {
        $values = array_values(array_filter(
            array_column($raw, 1),
            static fn (float $v): bool => is_finite($v)
        ));

        $kept = $values;
        $excluded = 0;

        if (count($values) >= self::OUTLIER_MIN_SAMPLES) {
            $median = self::median($values);

            // A median of 0 (or no median) gives no scale to judge against.
            if ($median != 0.0) {
                $lower = $median * self::OUTLIER_LOW_RATIO;
                $upper = $median * self::OUTLIER_HIGH_RATIO;
                if ($lower > $upper) {
                    // Negative median: the band flips around it.
                    [$lower, $upper] = [$upper, $lower];
                }

                $suspect = array_values(array_filter(
                    $values,
                    static fn (float $v): bool => $v < $lower || $v > $upper
                ));
                $survivors = array_values(array_filter(
                    $values,
                    static fn (float $v): bool => $v >= $lower && $v <= $upper
                ));

                $maxDroppable = (int) floor(count($values) * self::OUTLIER_MAX_DROP_RATIO);

                if ($suspect !== [] && $survivors !== [] && count($suspect) <= $maxDroppable) {
                    $kept = $survivors;
                    $excluded = count($suspect);
                }
            }
        }

        // Re-walk the raw pairs so every kept value lands in its own month.
        $keptLookup = array_count_values(array_map(static fn (float $v): string => self::valueKey($v), $kept));
        $monthly = [];

        for ($m = 1; $m <= 12; $m++) {
            $monthly[$m - 1] = [
                'month' => $m,
                'label' => self::MONTH_LABELS[$m - 1],
                'count' => 0,
                'min'   => null,
                'max'   => null,
                'avg'   => null,
            ];
        }

        foreach ($raw as [$monthIdx, $value]) {
            if ($monthIdx < 0 || $monthIdx > 11 || ! is_finite($value)) {
                continue;
            }
            if (($keptLookup[self::valueKey($value)] ?? 0) < 1) {
                continue;
            }
            $keptLookup[self::valueKey($value)]--;

            $bucket = &$monthly[$monthIdx];
            $bucket['count']++;
            $bucket['min'] = $bucket['min'] === null ? $value : min($bucket['min'], $value);
            $bucket['max'] = $bucket['max'] === null ? $value : max($bucket['max'], $value);
            $bucket['_sum'] = ($bucket['_sum'] ?? 0) + $value;
            unset($bucket);
        }

        foreach ($monthly as &$bucket) {
            if ($bucket['count'] > 0) {
                $bucket['min'] = round($bucket['min'], 2);
                $bucket['max'] = round($bucket['max'], 2);
                $bucket['avg'] = round($bucket['_sum'] / $bucket['count'], 2);
            }
            unset($bucket['_sum']);
        }
        unset($bucket);

        return [
            'samples'          => count($kept),
            'samples_excluded' => $excluded,
            'monthly'          => array_values($monthly),
        ];
    }

    /**
     * 12-month null skeleton, used when no point was requested or matched.
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
                'min'   => null,
                'max'   => null,
                'avg'   => null,
            ];
        }

        return [
            'parameter_number' => null,
            'parameter_name'   => null,
            'unit'             => null,
            'cell_key'         => null,
            'cell_label'       => null,
            'total_samples'    => 0,
            'samples_excluded' => 0,
            'points'           => $points,
        ];
    }

    /** Stable string form of a float, for bucketing multiset lookups. */
    private static function valueKey(float $value): string
    {
        return rtrim(rtrim(number_format($value, 6, '.', ''), '0'), '.') ?: '0';
    }

    /**
     * Median over an unsorted list. Averages the middle pair on even counts.
     *
     * @param  array<int, float>  $values
     */
    private static function median(array $values): float
    {
        if ($values === []) {
            return 0.0;
        }

        sort($values);
        $count = count($values);
        $mid = intdiv($count, 2);

        return $count % 2 === 1
            ? (float) $values[$mid]
            : (((float) $values[$mid - 1]) + ((float) $values[$mid])) / 2;
    }

    /** All TFP Performance modules, in registry order. */
    private static function tfpModules(): array
    {
        return array_values(array_filter(
            DashboardModuleRegistry::modules(),
            static fn (array $module): bool => $module['group'] === self::TFP_GROUP
        ));
    }

    private static function findModule(string $key): ?array
    {
        foreach (self::tfpModules() as $module) {
            if ($module['key'] === $key) {
                return $module;
            }
        }
        return null;
    }

    /**
     * Normalise a stored reading to a float, or null when it is not a number.
     *
     * Handles "-" and "" (empty cells), strips thousands separators, and
     * treats a lone comma as the Indonesian decimal mark ("220,5" → 220.5).
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
     * Map every cell key of a record's columns_config to a human label,
     * e.g. "panel_rd01.value" => "Panel RD 01 · Nilai".
     *
     * @param  array<int, array<string, mixed>>  $config
     * @return array<string, string>
     */
    private static function cellLabels(array $config): array
    {
        $labels = [];

        foreach ($config as $panel) {
            $panelId = (string) ($panel['id'] ?? '');
            $panelLabel = (string) ($panel['label'] ?? $panelId);
            if ($panelId === '') {
                continue;
            }

            foreach ($panel['sub_columns'] ?? [] as $sub) {
                $subKey = (string) ($sub['key'] ?? '');
                if ($subKey === '') {
                    continue;
                }
                $subLabel = (string) ($sub['label'] ?? $subKey);
                $labels[$panelId . '.' . $subKey] = $subLabel === $panelLabel
                    ? $panelLabel
                    : $panelLabel . ' · ' . $subLabel;
            }
        }

        return $labels;
    }

    /** Last-resort label when a cell key has no matching columns_config entry. */
    private static function humaniseCellKey(string $cellKey): string
    {
        return str_replace('.', ' · ', $cellKey);
    }
}