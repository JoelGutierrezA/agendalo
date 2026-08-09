<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBusiness;

class OpeningHour extends Model
{
    use HasFactory, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'day_of_week',
        'is_open',
        'open_time',
        'close_time',
    ];

    protected $casts = [
        'is_open' => 'boolean',
    ];

    /**
     * Relación: Pertenencia al Negocio
     */
    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
