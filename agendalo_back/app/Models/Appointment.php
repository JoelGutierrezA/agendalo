<?php

namespace App\Models;

use App\Traits\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'client_id',
        'service_id',
        'client_name',
        'client_email',
        'client_phone',
        'scheduled_at',
        'duration_minutes',
        'status',
        'notes',
        'is_from_public',
        'google_event_id',
        'cancelled_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'is_from_public' => 'boolean',
    ];

    /**
     * El cliente asociado (si existe en la base de datos).
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * El servicio reservado.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
