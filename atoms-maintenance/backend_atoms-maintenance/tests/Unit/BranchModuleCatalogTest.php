<?php

namespace Tests\Unit;

use App\Models\Branch\BranchModule;
use App\Services\Dashboard\DashboardModuleRegistry;
use Tests\TestCase;

/**
 * Branch office module availability is *derived* from
 * DashboardModuleRegistry — these tests fail if someone reintroduces a
 * hardcoded, second copy of the module list.
 */
class BranchModuleCatalogTest extends TestCase
{
    public function test_catalog_is_derived_from_the_dashboard_module_registry(): void
    {
        $registry = DashboardModuleRegistry::modules();

        foreach (BranchModule::MODULE_TYPES as $type) {
            $expected = array_values(array_filter(
                $registry,
                static fn (array $module) => in_array($module['group'], BranchModule::TYPE_GROUPS[$type], true)
            ));

            $this->assertCount(
                count($expected),
                BranchModule::catalog($type),
                "catalog('{$type}') drifted from DashboardModuleRegistry"
            );
            $this->assertSame(
                array_column($expected, 'key'),
                BranchModule::keys($type),
                "keys('{$type}') drifted from DashboardModuleRegistry"
            );
        }
    }

    public function test_cnsd_family_covers_readiness_and_meter_reading(): void
    {
        $this->assertCount(17, BranchModule::keys('cnsd'));
        $this->assertContains('cnsd-readiness', BranchModule::keys('cnsd'));
        $this->assertContains('cnsd-radar', BranchModule::keys('cnsd'));
    }

    public function test_tfp_family_covers_ten_performance_checks(): void
    {
        $this->assertCount(10, BranchModule::keys('tfp'));
        $this->assertContains('tfp-tower', BranchModule::keys('tfp'));
        $this->assertContains('tfp-genset-radar', BranchModule::keys('tfp'));
    }

    public function test_ground_check_and_grounding_are_out_of_scope(): void
    {
        $all = BranchModule::allKeys();

        foreach (['gc-adc', 'gc-vhf', 'gc-llz', 'gc-gp', 'gc-dvor', 'grounding'] as $excluded) {
            $this->assertNotContains($excluded, $all, 'Ground Check / Grounding is not branch-configurable');
        }
    }

    public function test_every_catalog_row_is_labelled_and_routed(): void
    {
        foreach (BranchModule::MODULE_TYPES as $type) {
            foreach (BranchModule::catalog($type) as $row) {
                foreach (['key', 'label', 'group', 'route'] as $field) {
                    $this->assertNotEmpty($row[$field], "missing {$field} for {$row['key']}");
                }
            }
        }
    }

    public function test_all_keys_is_the_union_of_both_families(): void
    {
        $this->assertSame(
            array_merge(BranchModule::keys('cnsd'), BranchModule::keys('tfp')),
            BranchModule::allKeys()
        );
    }

    public function test_family_keys_are_prefixed_by_type(): void
    {
        foreach (BranchModule::keys('cnsd') as $key) {
            $this->assertStringStartsWith('cnsd-', $key);
        }
        foreach (BranchModule::keys('tfp') as $key) {
            $this->assertStringStartsWith('tfp-', $key);
        }
    }
}