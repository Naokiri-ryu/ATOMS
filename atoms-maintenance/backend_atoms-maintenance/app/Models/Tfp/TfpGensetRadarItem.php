<?php

namespace App\Models\Tfp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TfpGensetRadarItem extends Model
{
    protected $table = 'tfp_genset_radar_items';
    
    protected $fillable = [
        'record_id',
        'nomor',
        'uraian_pekerjaan',
        'kondisi_baik',
        'kondisi_tidak_baik',
        'keterangan',
        'satuan',
        'nilai',
    ];

    protected $casts = [
        'kondisi_baik' => 'boolean',
        'kondisi_tidak_baik' => 'boolean',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(TfpGensetRadarRecord::class);
    }
}
