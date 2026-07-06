<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'type',
        'quantity',
        'min_stock',
        'product_number',
        'code_unique',
        'serial_number',
        'image_path',
        'qr_code_path',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->code_unique)) {
                $item->code_unique = 'SAKTI-' . strtoupper(Str::random(8));
            }
        });
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function borrowings()
    {
        return $this->hasMany(Borrowing::class);
    }

    public function activeBorrowings()
    {
        return $this->borrowings()->whereIn('status', ['dipinjam', 'digunakan']);
    }

    public function itemHistories()
    {
        return $this->hasMany(ItemHistory::class)->latest();
    }

    public function installations()
    {
        return $this->hasMany(Installation::class)->latest();
    }

    /**
     * Calculate available quantity.
     * For peralatan: quantity minus currently borrowed (dipinjam)
     * For komponen/asset: quantity minus approved installations (disetujui)
     */
    public function getAvailableQuantityAttribute(): int
    {
        if ($this->type === 'peralatan') {
            $unavailable = $this->activeBorrowings()->sum('quantity');
        } else {
            // For komponen and asset: subtract approved installations
            $unavailable = $this->installations()->where('status', 'disetujui')->sum('quantity');
        }
        return max(0, $this->quantity - $unavailable);
    }

    /**
     * Check if stock is at or below the minimum threshold.
     */
    public function getIsLowStockAttribute(): bool
    {
        return $this->available_quantity <= $this->min_stock;
    }
}
