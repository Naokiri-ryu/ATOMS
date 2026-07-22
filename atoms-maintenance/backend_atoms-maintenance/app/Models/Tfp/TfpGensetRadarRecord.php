<?php

namespace App\Models\Tfp;

use App\Models\LocalUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TfpGensetRadarRecord extends Model
{
    protected $table = 'tfp_genset_radar_records';
    
    protected $fillable = [
        'form_number',
        'tanggal',
        'shift',
        'jam',
        'engine',
        'alternator',
        'kapasitas',
        'status_operasi',
        'status_master_slave',
        'status',
        'manager_teknik_id',
        'supervisor_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function managerTeknik(): BelongsTo
    {
        return $this->belongsTo(LocalUser::class, 'manager_teknik_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(LocalUser::class, 'supervisor_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TfpGensetRadarItem::class);
    }

    public function technicians(): BelongsToMany
    {
        return $this->belongsToMany(LocalUser::class, 'tfp_genset_radar_technicians', 'record_id', 'technician_id');
    }
}
