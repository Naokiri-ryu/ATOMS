<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItemHistory extends Model
{
    protected $fillable = [
        'item_id',
        'user_id',
        'action',
        'old_data',
        'new_data',
        'notes',
    ];

    protected $casts = [
        'old_data' => 'array',
        'new_data' => 'array',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            'dibuat'          => 'Barang Ditambahkan',
            'diperbarui'      => 'Data Diperbarui',
            'stok_bertambah'  => 'Stok Bertambah',
            'stok_berkurang'  => 'Stok Berkurang',
            default           => ucfirst($this->action),
        };
    }
}
