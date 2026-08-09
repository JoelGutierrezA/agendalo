<?php

namespace App\Traits;

use App\Models\Business;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait BelongsToBusiness
{
    /**
     * Boot the BelongsToBusiness trait.
     *
     * @return void
     */
    protected static function bootBelongsToBusiness(): void
    {
        // Aplicar scope global para filtrar siempre por business_id
        static::addGlobalScope('business', function (Builder $builder) {
            $user = Auth::user();
            
            // Si es admin de plataforma, no aplicamos el scope (puede ver todo)
            if ($user && $user->role === 'admin_platform') {
                return;
            }

            if (session()->has('business_id')) {
                $builder->where($builder->getQuery()->from . '.business_id', session('business_id'));
            } elseif ($user && !app()->runningInConsole()) {
                if ($user->business_id) {
                    $builder->where($builder->getQuery()->from . '.business_id', $user->business_id);
                }
            }
        });

        // Asignar automáticamente el business_id al crear el registro
        static::creating(function (Model $model) {
            if (empty($model->business_id)) {
                if (session()->has('business_id')) {
                    $model->business_id = session('business_id');
                } elseif (Auth::check()) {
                    $model->business_id = Auth::user()->business_id;
                }
            }
        });
    }

    /**
     * Relación con el negocio.
     */
    public function business()
    {
        return $this->belongsTo(Business::class);
    }
}
