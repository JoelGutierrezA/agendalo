<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveBusiness
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Si el usuario no tiene negocio y no está en la ruta de creación de negocio
        if (!$user->business_id && !$request->is('api/business*') && $request->isMethod('GET')) {
            return response()->json([
                'success' => false,
                'message' => 'Es necesario configurar un negocio para continuar.',
                'code' => 'BUSINESS_NOT_FOUND'
            ], 403);
        }

        // Si el negocio existe pero está inactivo
        if ($user->business && !$user->business->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Tu negocio se encuentra inactivo. Contacta a soporte.',
                'code' => 'BUSINESS_INACTIVE'
            ], 403);
        }

        return $next($request);
    }
}
