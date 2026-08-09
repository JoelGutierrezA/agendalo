<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoogleIntegration extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'google_email',
        'access_token',
        'refresh_token',
        'token_type',
        'scope',
        'calendar_id',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
