<?php

namespace Tests\Feature;

use App\Services\Statistics\GroundCheckStatisticsService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tests\TestCase;

class GroundCheckStatisticsTest extends TestCase
{
    private function service(): GroundCheckStatisticsService
    {
        return app(GroundCheckStatisticsService::class);
    }

    public function test_index_returns_all_five_modules(): void
    {
        $index = $this->service()->moduleIndex(2026);

        $this->assertSame(2026, $index['year']);
        $this->assertCount(5, $index['modules']);

        $keys = array_column($index['modules'], 'module_key');
        $this->assertSame(
            ['gc-adc', 'gc-vhf', 'gc-llz', 'gc-gp', 'gc-dvor'],
            $keys
        );
    }

    public function test_index_marks_only_llz_and_dvor_as_numeric(): void
    {
        $byKey = [];
        foreach ($this->service()->moduleIndex(2026)['modules'] as $module) {
            $byKey[$module['module_key']] = $module;
        }

        $this->assertTrue($byKey['gc-llz']['has_numeric']);
        $this->assertTrue($byKey['gc-dvor']['has_numeric']);
        // ADC, VHF, GP now have numeric metrics from items tables
        $this->assertTrue($byKey['gc-adc']['has_numeric']);
        $this->assertTrue($byKey['gc-vhf']['has_numeric']);
        $this->assertTrue($byKey['gc-gp']['has_numeric']);

        $this->assertSame(12, $byKey['gc-llz']['metric_count']);
        $this->assertSame(4, $byKey['gc-dvor']['metric_count']);
        $this->assertSame(2, $byKey['gc-adc']['metric_count']);
        $this->assertSame(2, $byKey['gc-vhf']['metric_count']);
        $this->assertSame(2, $byKey['gc-gp']['metric_count']);
    }

    public function test_module_with_numeric_metrics_returns_series(): void
    {
        $detail = $this->service()->module('gc-adc', 2026);

        $this->assertSame('gc-adc', $detail['module_key']);
        $this->assertTrue($detail['has_numeric']);
        $this->assertNotEmpty($detail['available_metrics']);
        $this->assertCount(12, $detail['series']['points']);
    }

    public function test_monthly_counts_have_twelve_entries(): void
    {
        $detail = $this->service()->module('gc-adc', 2026);

        $this->assertCount(12, $detail['monthly_total']);
        $this->assertCount(12, $detail['monthly_completed']);
        $this->assertSame(
            array_sum($detail['monthly_total']),
            $detail['records_total']
        );
        $this->assertSame(
            array_sum($detail['monthly_completed']),
            $detail['records_completed']
        );
    }

    public function test_available_metrics_match_requested_series(): void
    {
        $detail = $this->service()->module('gc-dvor', 2026);

        $this->assertNotEmpty($detail['available_metrics']);
        $metricKeys = array_column($detail['available_metrics'], 'metric_key');
        $this->assertSame(['tx1_error', 'tx2_error', 'tx1_reading', 'tx2_reading'], $metricKeys);

        $detail = $this->service()->module('gc-dvor', 2026, 'tx1_error');

        $this->assertSame('tx1_error', $detail['series']['metric_key']);
        $this->assertSame('Error TX 1', $detail['series']['label']);
        $this->assertCount(12, $detail['series']['points']);
    }

    public function test_unknown_metric_falls_back_to_empty_series(): void
    {
        $detail = $this->service()->module('gc-dvor', 2026, 'not_a_column');

        $this->assertNull($detail['series']['metric_key']);
        $this->assertSame(0, $detail['series']['total_samples']);
    }

    public function test_unknown_module_returns_404(): void
    {
        $this->expectException(NotFoundHttpException::class);

        $this->service()->module('gc-nope', 2026);
    }

    public function test_tfp_module_key_is_rejected(): void
    {
        // Memastikan service ini tidak ikut menerima modul di luar Ground Check.
        $this->expectException(NotFoundHttpException::class);

        $this->service()->module('tfp-tower', 2026);
    }
}
