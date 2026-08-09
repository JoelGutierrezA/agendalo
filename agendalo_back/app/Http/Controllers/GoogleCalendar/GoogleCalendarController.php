<?php

namespace App\Http\Controllers\GoogleCalendar;

use App\Http\Controllers\Controller;
use App\Services\GoogleCalendarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Throwable;

class GoogleCalendarController extends Controller
{
    public function __construct(private readonly GoogleCalendarService $googleCalendarService)
    {
    }

    public function authUrl()
    {
        $business = Auth::user()?->business;

        if (!$business) {
            return $this->error('Debes tener un negocio configurado para enlazar Google Calendar', 422);
        }

        try {
            $url = $this->googleCalendarService->getAuthUrl($business);
            return $this->success(['auth_url' => $url], 'URL de autorización generada');
        } catch (Throwable $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    public function status()
    {
        $business = Auth::user()?->business;

        if (!$business) {
            return $this->error('No se encontró un negocio asociado al usuario', 422);
        }

        return $this->success(
            $this->googleCalendarService->getStatus($business),
            'Estado de integración cargado'
        );
    }

    public function disconnect()
    {
        $business = Auth::user()?->business;

        if (!$business) {
            return $this->error('No se encontró un negocio asociado al usuario', 422);
        }

        $this->googleCalendarService->disconnect($business);
        return $this->success(['connected' => false], 'Google Calendar desconectado');
    }

    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:4200'), '/');

        if ($request->query('error')) {
            return redirect()->away($frontendUrl . '/app/configuracion?tab=calendar&google=error');
        }

        $result = $this->googleCalendarService->handleOAuthCallback(
            $request->query('code'),
            $request->query('state')
        );

        if (!($result['success'] ?? false)) {
            return redirect()->away($frontendUrl . '/app/configuracion?tab=calendar&google=error');
        }

        return redirect()->away($frontendUrl . '/app/configuracion?tab=calendar&google=connected');
    }
}
