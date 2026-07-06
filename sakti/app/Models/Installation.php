<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Installation extends Model
{
    protected $fillable = [
        'user_id',
        'item_id',
        'quantity',
        'notes',
        'location',
        'photo_path',
        'status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'installed_at',
    ];

    protected $casts = [
        'approved_at'  => 'datetime',
        'installed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getIsPendingAttribute(): bool
    {
        return $this->status === 'menunggu_approval';
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'menunggu_approval' => 'Menunggu Approval',
            'disetujui'         => 'Disetujui',
            'ditolak'           => 'Ditolak',
            default             => ucfirst($this->status),
        };
    }
}
