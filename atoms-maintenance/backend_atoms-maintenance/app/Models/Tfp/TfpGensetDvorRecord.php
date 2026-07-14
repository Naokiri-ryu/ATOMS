<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class TfpGensetDvorRecord extends Model
{
    protected $table = 'tfp_genset_dvor_records';
    
    protected $fillable = [
        'form_number',
        'tanggal',
        'shift',
        'jam',
        'engine',
        'alternator',
        'kapasitas',
        'status',
        'manager_teknik_id',
        'supervisor_id',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function managerTeknik(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_teknik_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TfpGensetDvorItem::class);
    }

    public function technicians(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tfp_genset_dvor_technicians', 'record_id', 'technician_id');
    }
}