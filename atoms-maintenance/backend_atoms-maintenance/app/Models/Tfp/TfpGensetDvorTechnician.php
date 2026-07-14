<?php

namespace App\Models\Tfp;

use App\Models\LocalUser;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TfpGensetDvorTechnician — one row per TFP technician on duty for a given
 * Genset DVOR record. Technician signatures live here.
 */
class TfpGensetDvorTechnician extends Model
{
    protected $table = 'tfp_genset_dvor_technicians';

    protected $fillable = [
        'genset_dvor_record_id',
        'technician_id',
        'technician_name',
        'technician_signature',
        'technician_signed_by',
        'technician_signed_at',
        'sort_order',
    ];

    protected $casts = [
        'technician_signed_at' => 'datetime',
        'sort_order'           => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────

    public function record(): BelongsTo
    {
        return $this->belongsTo(TfpGensetDvorRecord::class, 'genset_dvor_record_id');
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(LocalUser::class, 'technician_id');
    }

    public function signer(): BelongsTo
    {
        return $this->belongsTo(LocalUser::class, 'technician_signed_by');
    }
}