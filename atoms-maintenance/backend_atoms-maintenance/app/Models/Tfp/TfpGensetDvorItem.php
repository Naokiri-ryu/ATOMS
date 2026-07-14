<?php

namespace App\Models\Tfp;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TfpGensetDvorItem — one measurement parameter row for a TFP Genset DVOR record.
 *
 * Cell values live in `values` JSON, keyed by composite "panelId.subKey"
 * (e.g. "value.value" by default — a single "Nilai" column). The panel
 * structure is defined per record via tfp_genset_dvor_records.columns_config.
 *
 * `is_disabled_map` and `merge_map` use the same composite key.
 *
 * `group_label` groups several rows under one paper-form heading (e.g.
 * "Pengukuran Tegangan Output Genset" spanning the V R-N / V R-S / ... rows).
 */
class TfpGensetDvorItem extends Model
{
    protected $table = 'tfp_genset_dvor_items';

    protected $fillable = [
        'genset_dvor_record_id',
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

    // ─── Relationships ─────────────────────────────────────────

    public function record(): BelongsTo
    {
        return $this->belongsTo(TfpGensetDvorRecord::class, 'genset_dvor_record_id');
    }
}