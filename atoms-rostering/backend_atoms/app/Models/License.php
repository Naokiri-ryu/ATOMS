<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class License extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'license_name',
        'license_number',
        'valid_until',
        'keterangan',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}