<?php

namespace App\Models;

use App\Traits\BelongsToBusiness;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, BelongsToBusiness;

    protected $fillable = [
        'business_id',
        'name',
        'email',
        'phone',
        'notes',
        'last_visit_at',
    ];

    protected $casts = [
        'last_visit_at' => 'datetime',
    ];

    /**
     * Historial de citas del cliente.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }
}
