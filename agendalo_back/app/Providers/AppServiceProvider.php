<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Alinea parsing/serializacion de fechas con el negocio por defecto en Chile.
        config(['app.timezone' => env('APP_TIMEZONE', 'America/Santiago')]);
        date_default_timezone_set(config('app.timezone', 'America/Santiago'));

        // Personalizar el URL del link de reset para que apunte al frontend Angular
        ResetPassword::createUrlUsing(function ($user, string $token) {
            $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:4200'));
            return $frontendUrl . '/restablecer-contrasena?token=' . $token . '&email=' . urlencode($user->email);
        });
    }
}
