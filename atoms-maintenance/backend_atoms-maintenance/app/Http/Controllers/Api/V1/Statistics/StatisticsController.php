<?php

namespace App\Http\Controllers\Api\V1\Statistics;

use App\Http\Controllers\Controller;
use App\Http\Requests\Statistics\TfpEquipmentStatisticsRequest;
use App\Services\Statistics\StatisticsOverviewService;
use App\Services\Statistics\TfpParameterStatisticsService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * StatisticsController — read-only recap of completed CNSD & TFP form
 * submissions behind the /statistics page. Open to any authenticated user.
 *
 * `overview` is the legacy cross-module recap (CNSD + TFP submission counts).
 * The /statistics UI itself now drills into TFP equipment via `tfpEquipmentIndex`
 * and `tfpEquipment`; the overview endpoint is kept for existing API consumers.
 */
class StatisticsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected StatisticsOverviewService $statisticsService,
        protected TfpParameterStatisticsService $tfpStatisticsService,
    ) {}

    /**
     * GET /api/v1/statistics/overview?year=YYYY
     *
     * Defaults to the current year when the param is omitted.
     */
    public function overview(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $year = (int) ($request->input('year') ?? $now->year);

        // Defensive bounds — same convention as DashboardMonthlyController.
        if ($year < 2020 || $year > 2099) {
            $year = $now->year;
        }

        $data = $this->statisticsService->overviewForYear($year);

        return $this->success($data, 'Statistik overview retrieved');
    }

    /**
     * GET /api/v1/statistics/tfp/equipment?year=YYYY
     *
     * Yearly recap for all 10 TFP Performance Check modules — the equipment
     * picker on /statistics.
     */
    public function tfpEquipmentIndex(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $year = (int) ($request->input('year') ?? $now->year);

        if ($year < 2020 || $year > 2099) {
            $year = $now->year;
        }

        return $this->success(
            $this->tfpStatisticsService->equipmentIndex($year),
            'Daftar peralatan TFP retrieved'
        );
    }

    /**
     * GET /api/v1/statistics/tfp/{moduleKey}?year=YYYY
     *   &parameter_number=&parameter_name=&cell_key=
     *
     * Without the point params: recap + the measurement points available for
     * the year (what the dropdown lists). With them: the 12-month min/max/avg
     * series for that single measurement point.
     */
    public function tfpEquipment(
        string $moduleKey,
        TfpEquipmentStatisticsRequest $request
    ): JsonResponse {
        $now = Carbon::now();
        $year = (int) ($request->input('year') ?? $now->year);

        if ($year < 2020 || $year > 2099) {
            $year = $now->year;
        }

        $data = $this->tfpStatisticsService->equipment(
            $moduleKey,
            $year,
            $request->input('parameter_number'),
            $request->input('parameter_name'),
            $request->input('cell_key'),
        );

        return $this->success($data, 'Statistik peralatan TFP retrieved');
    }
}
