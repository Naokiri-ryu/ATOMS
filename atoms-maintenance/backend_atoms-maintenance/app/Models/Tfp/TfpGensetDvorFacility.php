<?php

namespace App\Models\Tfp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TfpGensetDvorFacility — one checklist row ("Uraian Pekerjaan") for a TFP
 * Genset DVOR record. Seeded from TfpGensetDvorTemplate at create-time.
 * Technicians fill in kondisi (Baik / Tidak Baik) and optional keterangan.
 */
class TfpGensetDvorFacility extends Model
{
    protected $table = 'tfp_genset_dvor_facilities';

    protected $fillable = [
        'genset_dvor_record_id',
        'facility_name',
        'kondisi',
        'keterangan',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    // ─── Relationships ─────────────────────────────────────────

    public function record(): BelongsTo
    {
        return $this->belongsTo(TfpGensetDvorRecord::class, 'genset_dvor_record_id');
    }
}