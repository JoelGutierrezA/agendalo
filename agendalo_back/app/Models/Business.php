<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Business extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'category_id',
        'name',
        'slug',
        'description',
        'phone',
        'email',
        'address',
        'city',
        'country',
        'logo_url',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * El dueño del negocio.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * La categoría del negocio.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Configuración del negocio.
     */
    public function settings(): HasOne
    {
        return $this->hasOne(BusinessSetting::class);
    }

    /**
     * Horarios de atención.
     */
    public function openingHours(): HasMany
    {
        return $this->hasMany(OpeningHour::class);
    }

    /**
     * Servicios que ofrece el negocio.
     */
    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    /**
     * Clientes del negocio.
     */
    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    /**
     * Citas del negocio.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Integracion con Google Calendar.
     */
    public function googleIntegration(): HasOne
    {
        return $this->hasOne(GoogleIntegration::class);
    }
}
