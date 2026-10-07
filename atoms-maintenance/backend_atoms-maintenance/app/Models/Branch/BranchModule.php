<?php

namespace App\Models\Branch;

use App\Services\Dashboard\DashboardModuleRegistry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Per-branch availability flag for a single maintenance module.
 *
 * The module keys are NOT declared here — they are read from
 * DashboardModuleRegistry, which is the app-wide single source of truth for
 * every module (key + label + division + group + route). That keeps branch
 * configuration in lock-step with the dashboard checklist and statistics, so a
 * module added there is automatically configurable per branch.
 */
class BranchModule extends Model
{
    public const MODULE_TYPES = ['cnsd', 'tfp'];

    /**
     * Which DashboardModuleRegistry groups belong to each branch family.
     *
     * "Ground Check" and "Grounding" are deliberately excluded: they are
     * operational checklists rather than per-branch equipment sets.
     */
    public const TYPE_GROUPS = [
        'cnsd' => ['CNSD Readiness', 'CNSD Meter Reading'],
        'tfp'  => ['TFP Performance'],
    ];

    protected $table = 'branch_modules';

    protected $fillable = [
        'branch_office_id',
        'module_type',
        'module_key',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function branchOffice(): BelongsTo
    {
        return $this->belongsTo(BranchOffice::class, 'branch_office_id');
    }

    /**
     * Configurable modules for one family.
     *
     * @return array<int, array{key:string,label:string,group:string,route:string}>
     */
    public static function catalog(string $type): array
    {
        $groups = self::TYPE_GROUPS[$type] ?? [];

        $rows = array_filter(
            DashboardModuleRegistry::modules(),
            static fn (array $module) => in_array($module['group'], $groups, true)
        );

        return array_values(array_map(static fn (array $module) => [
            'key'   => $module['key'],
            'label' => $module['label'],
            'group' => $module['group'],
            'route' => $module['route'],
        ], $rows));
    }

    /**
     * Valid module keys for one family.
     *
     * @return array<int, string>
     */
    public static function keys(string $type): array
    {
        return array_column(self::catalog($type), 'key');
    }

    /**
     * Every valid module key across all families.
     *
     * @return array<int, string>
     */
    public static function allKeys(): array
    {
        return array_merge(self::keys('cnsd'), self::keys('tfp'));
    }
}