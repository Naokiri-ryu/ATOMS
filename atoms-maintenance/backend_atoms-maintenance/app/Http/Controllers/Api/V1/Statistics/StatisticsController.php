<?php

namespace App\Http\Controllers\Api\V1\Statistics;

use App\Http\Controllers\Controller;
use App\Http\Requests\Statistics\GroundCheckStatisticsRequest;
use App\Http\Requests\Statistics\TfpEquipmentStatisticsRequest;
use App\Services\Statistics\GroundCheckStatisticsService;
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
 * The /statistics UI is a hub that drills into either TFP Performance Check
 * (`tfpEquipmentIndex` / `tfpEquipment`) or Ground Check (`groundCheckIndex` /
 * `groundCheck`); the overview endpoint is kept for existing API consumers.
 */
class StatisticsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected StatisticsOverviewService $statisticsService,
        protected TfpParameterStatisticsService $tfpStatisticsService,
        protected GroundCheckStatisticsService $groundCheckStatisticsService,
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

    /**
     * GET /api/v1/statistics/ground-check?year=YYYY
     *
     * Yearly recap for all 5 Ground Check modules — the equipment picker on
     * /statistics/ground-check. Each entry also carries `has_numeric`, so the
     * UI can tell the three recap-only modules (ADC, VHF, Glide Path) apart
     * from the two that also carry a measurement chart (Localizer, DVOR).
     */
    public function groundCheckIndex(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $year = (int) ($request->input('year') ?? $now->year);

        if ($year < 2020 || $year > 2099) {
            $year = $now->year;
        }

        return $this->success(
            $this->groundCheckStatisticsService->moduleIndex($year),
            'Daftar peralatan Ground Check retrieved'
        );
    }

    /**
     * GET /api/v1/statistics/ground-check/{moduleKey}?year=YYYY&metric_key=
     *
     * Without `metric_key`: recap, completion trend, and the measurement
     * metrics found for the year (what the dropdown lists). With it: the
     * 12-month min/max/avg series for that single measurement column.
     *
     * ADC / VHF / Glide Path have no numeric measurements, so they always come
     * back with `has_numeric: false`, an empty metric list, and a null series —
     * they are completion-only modules.
     */
    public function groundCheck(
        string $moduleKey,
        GroundCheckStatisticsRequest $request
    ): JsonResponse {
        $now = Carbon::now();
        $year = (int) ($request->input('year') ?? $now->year);

        if ($year < 2020 || $year > 2099) {
            $year = $now->year;
        }

        $data = $this->groundCheckStatisticsService->module(
            $moduleKey,
            $year,
            $request->input('metric_key'),
        );

        return $this->success($data, 'Statistik Ground Check retrieved');
    }
}
