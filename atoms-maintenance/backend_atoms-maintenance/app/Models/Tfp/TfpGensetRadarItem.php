<?php

namespace App\Models\Tfp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TfpGensetRadarItem extends Model
{
    protected $table = 'tfp_genset_radar_items';

    protected $fillable = [
        'genset_radar_record_id',
        'parameter_number',
        'group_label',
        'parameter_name',
        'unit',
        'values',
        'is_disabled_map',
        'merge_map',
        'sort_order',
    ];

    protected $casts = [
        'values'          => 'array',
        'is_disabled_map' => 'array',
        'merge_map'       => 'array',
        'sort_order'      => 'integer',
    ];

    public function record(): BelongsTo
    {
        return $this->belongsTo(TfpGensetRadarRecord::class, 'genset_radar_record_id');
    }
}
