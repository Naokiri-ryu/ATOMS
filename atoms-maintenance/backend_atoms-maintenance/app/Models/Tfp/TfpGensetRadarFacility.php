<?php

namespace App\Models\Tfp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TfpGensetRadarFacility extends Model
{
    protected $table = 'tfp_genset_radar_facilities';

    protected $fillable = [
        'genset_radar_record_id',
        'facility_name',
        'kondisi',
        'keterangan',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(TfpGensetRadarRecord::class, 'genset_radar_record_id');
    }
}
