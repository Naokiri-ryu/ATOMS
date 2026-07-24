<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SupportTicket extends Model
{
    use HasFactory, SoftDeletes, HasAuditFields;

    // Status constants
    public const STATUS_OPEN = 'open';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_CLOSED = 'closed';

    // Category constants
    public const CATEGORY_BUG_REPORT = 'bug_report';
    public const CATEGORY_FEATURE_REQUEST = 'feature_request';

    protected $fillable = [
        'user_id',
        'category',
        'title',
        'description',
        'status',
        'attachment_path',
        'attachment_original_name',
        'admin_response',
        'responded_by',
        'responded_at',
    ];

    protected function casts(): array
    {
        return [
            'responded_at' => 'datetime',
        ];
    }

    protected $appends = [
        'category_name',
        'status_name',
        'attachment_url',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }

    // Accessors
    public function getCategoryNameAttribute(): string
    {
        return match ($this->category) {
            self::CATEGORY_BUG_REPORT => 'Bug Report',
            self::CATEGORY_FEATURE_REQUEST => 'Feature Request',
            default => $this->category,
        };
    }

    public function getStatusNameAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_OPEN => 'Open',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_RESOLVED => 'Resolved',
            self::STATUS_CLOSED => 'Closed',
            default => $this->status,
        };
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        if (!$this->attachment_path) {
            return null;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->attachment_path);
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
