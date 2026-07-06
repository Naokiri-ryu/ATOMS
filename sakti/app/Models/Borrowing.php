<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Borrowing extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'item_id',
        'quantity',
        'borrow_photo_path',
        'return_photo_path',
        'usage_notes',
        'borrowed_at',
        'returned_at',
        'status',
        'expected_return_time',
    ];

    protected function casts(): array
    {
        return [
            'borrowed_at' => 'datetime',
            'returned_at' => 'datetime',
            'expected_return_time' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Check if this borrowing is for a consumable (komponen).
     */
    public function getIsConsumableAttribute(): bool
    {
        return $this->status === 'digunakan';
    }

    public function getIsOverdueAttribute(): bool
    {
        if ($this->status !== 'dipinjam') {
            return false;
        }

        return $this->borrowed_at->diffInHours(Carbon::now()) >= 6;
    }

    // Active = items currently out (borrowed equipment OR consumed components)
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['dipinjam', 'digunakan']);
    }

    // Only equipment that is currently borrowed (not returned yet)
    public function scopeBorrowed($query)
    {
        return $query->where('status', 'dipinjam');
    }

    // Only consumed/used components
    public function scopeUsed($query)
    {
        return $query->where('status', 'digunakan');
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'dipinjam')
            ->where('borrowed_at', '<=', Carbon::now()->subHours(6));
    }

    public function scopeReturned($query)
    {
        return $query->where('status', 'dikembalikan');
    }
}
