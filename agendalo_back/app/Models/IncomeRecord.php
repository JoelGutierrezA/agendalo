<?php

namespace App\Models;

use App\Traits\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IncomeRecord extends Model
{
    use HasFactory, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'appointment_id',
        'description',
        'amount',
        'recorded_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'recorded_at' => 'date',
    ];

    /**
     * Cita relacionada (opcional).
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
