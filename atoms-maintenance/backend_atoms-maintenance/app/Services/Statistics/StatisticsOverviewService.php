<?php

namespace App\Services\Statistics;

use App\Services\Dashboard\DashboardModuleRegistry;

/**
 * StatisticsOverviewService — aggregates completed CNSD + TFP form
 * submissions for a whole calendar year, powering the /statistics page.
 *
 * Mirrors DashboardMonthlySummaryService's definition of "disetor":
 * only records with status = 'completed' (all required signatures
 * present) count; soft-deleted rows are excluded automatically.
 *
 * Modules are taken straight from DashboardModuleRegistry (not from the
 * monthly-targets table) so every module of the CNSD & TFP menus appears
 * even when no target has been configured. Ground Check / Grounding live
 * under their own top-level menus and stay out of scope here.
 */
class StatisticsOverviewService
{
    /** Registry groups belonging to the CNSD & TFP menus. */
    private const MENU_GROUPS = ['CNSD Readiness', 'CNSD Meter Reading', 'TFP Performance'];

    private const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    /**
     * @return array{
     *   year: int,
     *   totals: array{CNSD: int, TFP: int},
     *   grand_total: int,
     *   trend: array<int, array{month:int, label:string, cnsd:int, tfp:int, total:int}>,
     *   modules: array<int, array<string, mixed>>,
     * }
     */
    public function overviewForYear(int $year): array
    {
        $trend = [];
        for ($m = 1; $m <= 12; $m++) {
            $trend[] = [
                'month' => $m,
                'label' => self::MONTH_LABELS[$m - 1],
                'cnsd'  => 0,
                'tfp'   => 0,
                'total' => 0,
            ];
        }

        $modules = [];
        $totals = ['CNSD' => 0, 'TFP' => 0];

        foreach (DashboardModuleRegistry::modules() as $module) {
            if (!in_array($module['group'], self::MENU_GROUPS, true)) {
                continue;
            }

            // One aggregate query per module: completed count per month + latest date.
            $rows = $module['model']::query()
                ->selectRaw('EXTRACT(MONTH FROM date)::int AS month, count(*) AS total, max(date) AS last_date')
                ->where('status', 'completed')
                ->when(!empty($module['form_type']), fn ($q) => $q->where('form_type', $module['form_type']))
                ->whereYear('date', $year)
                ->groupBy('month')
                ->get();

            $monthly = array_fill(0, 12, 0);
            $total = 0;
            $lastDate = null;

            foreach ($rows as $row) {
                $idx = (int) $row->month - 1;
                if ($idx < 0 || $idx > 11) {
                    continue;
                }
                $count = (int) $row->total;
                $monthly[$idx] = $count;
                $total += $count;

                $rowLastDate = substr((string) $row->last_date, 0, 10);
                if ($rowLastDate !== '' && ($lastDate === null || $rowLastDate > $lastDate)) {
                    $lastDate = $rowLastDate;
                }
            }

            if (array_key_exists($module['division'], $totals)) {
                $totals[$module['division']] += $total;
            }

            $divisionKey = strtolower($module['division']);
            foreach ($monthly as $i => $count) {
                if ($count === 0) {
                    continue;
                }
                if (isset($trend[$i][$divisionKey])) {
                    $trend[$i][$divisionKey] += $count;
                    $trend[$i]['total'] += $count;
                }
            }

            $modules[] = [
                'module_key' => $module['key'],
                'label'      => $module['label'],
                'division'   => $module['division'],
                'group'      => $module['group'],
                'route'      => $module['route'],
                'total'      => $total,
                'monthly'    => $monthly,
                'last_date'  => $lastDate,
            ];
        }

        return [
            'year'        => $year,
            'totals'      => $totals,
            'grand_total' => $totals['CNSD'] + $totals['TFP'],
            'trend'       => $trend,
            'modules'     => $modules,
        ];
    }
}
