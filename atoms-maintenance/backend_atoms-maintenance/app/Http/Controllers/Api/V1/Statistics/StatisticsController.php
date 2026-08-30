<?php

namespace App\Http\Controllers\Api\V1\Statistics;

use App\Http\Controllers\Controller;
use App\Services\Statistics\StatisticsOverviewService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * StatisticsController — read-only recap of completed CNSD & TFP form
 * submissions behind the /statistics page. Open to any authenticated user.
 */
class StatisticsController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected StatisticsOverviewService $statisticsService,
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
}
