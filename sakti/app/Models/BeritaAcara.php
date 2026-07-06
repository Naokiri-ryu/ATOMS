<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BeritaAcara extends Model
{
    use HasFactory;

    protected $table = 'berita_acara';

    protected $fillable = [
        'user_id',
        'nomor_ba',
        'title',
        'type',
        'description',
        'file_path',
        'file_name',
        'file_size',
        'signer_name',
        'manager_name',
        'location',
        'signature_path',
        'reference_id',
        'reference_type',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $ba) {
            $ba->nomor_ba = self::completeNomor($ba->nomor_ba, $ba->type);
        });
    }

    /**
     * Generate nomor BA — hanya sequence number, sisanya diisi manual.
     * Format: BAC.XXX (contoh: BAC.047)
     * Bagian lengkap diisi manual oleh user.
     */
    public static function generateNomor(string $type): string
    {
        $year = now()->year;

        // Hitung sequence per tipe per tahun
        $count = self::where('type', $type)
            ->whereYear('created_at', $year)
            ->count() + 1;

        $seq = str_pad($count, 3, '0', STR_PAD_LEFT);

        return "BAC.{$seq}";
    }

    /**
     * Ensure nomor BA is complete. A bare BAC.XXX is only the prefix and must
     * still get the GTT suffix before being stored or rendered in the PDF.
     */
    public static function completeNomor(?string $nomorBa, string $type): string
    {
        $nomorBa = trim((string) $nomorBa);

        if ($nomorBa === '') {
            $nomorBa = self::generateNomor($type);
        }

        if (preg_match('/^BAC\.\d+$/', $nomorBa) === 1) {
            return $nomorBa . '/' . self::generateNomorSuffix($nomorBa);
        }

        return $nomorBa;
    }

    /**
     * Build the automatic suffix part.
     * Format: GTT-01/06/LPPNPI/TEK/V/2026
     */
    public static function generateNomorSuffix(string $nomorPrefix): string
    {
        preg_match('/BAC\.(\d+)/', $nomorPrefix, $matches);
        $sequence = isset($matches[1])
            ? str_pad((string) (int) $matches[1], 2, '0', STR_PAD_LEFT)
            : now()->format('d');

        $romanMonths = [
            1 => 'I',
            2 => 'II',
            3 => 'III',
            4 => 'IV',
            5 => 'V',
            6 => 'VI',
            7 => 'VII',
            8 => 'VIII',
            9 => 'IX',
            10 => 'X',
            11 => 'XI',
            12 => 'XII',
        ];

        $month = $romanMonths[(int) now()->format('n')];

        return "GTT-{$sequence}/06/LPPNPI/TEK/{$month}/" . now()->year;
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'pemasangan' => 'Pemasangan',
            'pelepasan' => 'Pelepasan',
            'serah_terima' => 'Serah Terima',
            default => $this->type,
        };
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 1) . ' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 1) . ' KB';
        }

        return "{$bytes} B";
    }
}
