<?php

namespace App\Models\Branch;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BranchOffice extends Model
{
    protected $table = 'branch_offices';

    protected $fillable = [
        'code',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(BranchModule::class, 'branch_office_id');
    }

    public function availableModules(string $moduleType): HasMany
    {
        return $this->hasMany(BranchModule::class, 'branch_office_id')
            ->where('module_type', $moduleType)
            ->where('is_available', true);
    }
}