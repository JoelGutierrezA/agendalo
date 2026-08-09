<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Business;
use App\Models\GoogleIntegration;
use App\Models\Service;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Carbon\Carbon;
use RuntimeException;

class GoogleCalendarService
{
    private const STATE_PREFIX = 'google_oauth_state:';

    /**
     * Sincronizar una cita con Google Calendar.
     * (Placeholder para Fase 2)
     */
    public function syncAppointment(Appointment $appointment)
    {
        if (!Schema::hasTable('google_integrations')) {
            return false;
        }

        $appointment->loadMissing(['business.settings', 'service']);
        $business = $appointment->business;

        if (!$business) {
            return false;
        }

        $integration = GoogleIntegration::where('business_id', $business->id)->first();
        if (!$integration) {
            return false;
        }

        if ($appointment->status === 'cancelled') {
            return $this->deleteAppointmentEvent($appointment);
        }

        $accessToken = $this->getValidAccessToken($business->id);
        if (!$accessToken) {
            return false;
        }

        $calendarId = $integration->calendar_id ?: 'primary';
        $timezone = $business->settings?->time_zone ?: 'America/Santiago';

        $serviceName = $appointment->service?->name;
        if (!$serviceName && $appointment->service_id) {
            $serviceName = Service::find($appointment->service_id)?->name;
        }

        $start = Carbon::parse($appointment->scheduled_at);
        $end = $start->copy()->addMinutes((int) $appointment->duration_minutes);

        $payload = [
            'summary' => ($serviceName ? $serviceName . ' - ' : '') . $appointment->client_name,
            'description' => $this->buildDescription($appointment),
            'start' => [
                'dateTime' => $start->toIso8601String(),
                'timeZone' => $timezone,
            ],
            'end' => [
                'dateTime' => $end->toIso8601String(),
                'timeZone' => $timezone,
            ],
            'extendedProperties' => [
                'private' => [
                    'skedia_appointment_id' => (string) $appointment->id,
                    'skedia_business_id' => (string) $business->id,
                ],
            ],
        ];

        $sendInviteToClient = (bool) ($business->settings?->send_client_calendar_invite ?? true);
        if ($sendInviteToClient && !empty($appointment->client_email)) {
            $payload['attendees'] = [
                ['email' => $appointment->client_email],
            ];
        }

        if (!empty($appointment->google_event_id)) {
            $response = Http::withToken($accessToken)
                ->timeout(25)
                ->patch("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$appointment->google_event_id}", $payload);

            if ($response->successful()) {
                return true;
            }

            // Si el evento ya no existe en Google, creamos uno nuevo.
            if ($response->status() !== 404) {
                Log::warning('Google Calendar update failed', [
                    'appointment_id' => $appointment->id,
                    'status' => $response->status(),
                    'body' => $response->json(),
                ]);
                return false;
            }
        }

        $create = Http::withToken($accessToken)
            ->timeout(25)
            ->post("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", $payload);

        if ($create->failed()) {
            Log::warning('Google Calendar create failed', [
                'appointment_id' => $appointment->id,
                'status' => $create->status(),
                'body' => $create->json(),
            ]);
            return false;
        }

        $eventId = $create->json('id');
        if ($eventId) {
            $appointment->google_event_id = $eventId;
            $appointment->save();
        }

        return true;
    }

    /**
     * Obtiene eventos externos de Google para mostrarlos en Skedia en modo solo lectura.
     * Excluye eventos creados por Skedia y/o IDs indicados.
     */
    public function getReadOnlyEventsForRange(Business $business, Carbon $start, Carbon $end, array $excludeGoogleEventIds = []): array
    {
        if (!Schema::hasTable('google_integrations')) {
            return [];
        }

        $integration = GoogleIntegration::where('business_id', $business->id)->first();
        if (!$integration) {
            return [];
        }

        $accessToken = $this->getValidAccessToken($business->id);
        if (!$accessToken) {
            return [];
        }

        $calendarId = $integration->calendar_id ?: 'primary';
        $response = Http::withToken($accessToken)
            ->timeout(25)
            ->get("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events", [
                'singleEvents' => 'true',
                'orderBy' => 'startTime',
                'timeMin' => $start->toIso8601String(),
                'timeMax' => $end->toIso8601String(),
                'maxResults' => 250,
            ]);

        if ($response->failed()) {
            Log::warning('Google Calendar list events failed', [
                'business_id' => $business->id,
                'status' => $response->status(),
                'body' => $response->json(),
            ]);
            return [];
        }

        $items = $response->json('items', []);
        $events = [];

        foreach ($items as $item) {
            $googleEventId = $item['id'] ?? null;
            if (!$googleEventId) {
                continue;
            }

            if (in_array($googleEventId, $excludeGoogleEventIds, true)) {
                continue;
            }

            $privateProps = $item['extendedProperties']['private'] ?? [];
            if (!empty($privateProps['skedia_appointment_id'])) {
                continue;
            }

            $startAt = $item['start']['dateTime'] ?? ($item['start']['date'] ?? null);
            $endAt = $item['end']['dateTime'] ?? ($item['end']['date'] ?? null);
            if (!$startAt || !$endAt) {
                continue;
            }

            $summary = $item['summary'] ?? 'Evento Google';

            $events[] = [
                'id' => 'google_' . $googleEventId,
                'title' => $summary,
                'start' => Carbon::parse($startAt)->toIso8601String(),
                'end' => Carbon::parse($endAt)->toIso8601String(),
                'backgroundColor' => '#3B82F6',
                'extendedProps' => [
                    'status' => 'google',
                    'client_name' => $summary,
                    'service_name' => 'Google Calendar',
                    'source' => 'google',
                    'read_only' => true,
                    'google_event_id' => $googleEventId,
                ],
            ];
        }

        return $events;
    }

    public function deleteAppointmentEvent(Appointment $appointment): bool
    {
        if (empty($appointment->google_event_id)) {
            return true;
        }

        if (!Schema::hasTable('google_integrations')) {
            return false;
        }

        $business = $appointment->business;
        if (!$business) {
            $business = Business::find($appointment->business_id);
        }

        if (!$business) {
            return false;
        }

        $integration = GoogleIntegration::where('business_id', $business->id)->first();
        if (!$integration) {
            return false;
        }

        $accessToken = $this->getValidAccessToken($business->id);
        if (!$accessToken) {
            return false;
        }

        $calendarId = $integration->calendar_id ?: 'primary';
        $response = Http::withToken($accessToken)
            ->timeout(25)
            ->delete("https://www.googleapis.com/calendar/v3/calendars/{$calendarId}/events/{$appointment->google_event_id}");

        if ($response->successful() || $response->status() === 404) {
            $appointment->google_event_id = null;
            $appointment->save();
            return true;
        }

        Log::warning('Google Calendar delete failed', [
            'appointment_id' => $appointment->id,
            'status' => $response->status(),
            'body' => $response->json(),
        ]);

        return false;
    }

    /**
     * Obtener URL de autenticación de Google.
     */
    public function getAuthUrl(Business $business)
    {
        $config = $this->oauthConfig();

        if (!$config['client_id'] || !$config['client_secret'] || !$config['redirect_uri']) {
            throw new RuntimeException('Faltan variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REDIRECT_URI en el entorno');
        }

        $state = Str::random(48);
        Cache::store('file')->put(self::STATE_PREFIX . $state, $business->id, now()->addMinutes(10));

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'client_id' => $config['client_id'],
            'redirect_uri' => $config['redirect_uri'],
            'response_type' => 'code',
            'scope' => implode(' ', $config['scopes']),
            'access_type' => 'offline',
            'include_granted_scopes' => 'true',
            'prompt' => 'consent select_account',
            'state' => $state,
        ]);
    }

    public function getStatus(Business $business): array
    {
        if (!Schema::hasTable('google_integrations')) {
            return [
                'connected' => false,
                'google_email' => null,
                'expires_at' => null,
                'is_expired' => false,
                'calendar_id' => null,
            ];
        }

        $integration = GoogleIntegration::where('business_id', $business->id)->first();

        return [
            'connected' => (bool) $integration,
            'google_email' => $integration?->google_email,
            'expires_at' => $integration?->expires_at?->toIso8601String(),
            'is_expired' => $integration?->expires_at ? $integration->expires_at->isPast() : false,
            'calendar_id' => $integration?->calendar_id,
        ];
    }

    public function disconnect(Business $business): void
    {
        if (!Schema::hasTable('google_integrations')) {
            return;
        }

        GoogleIntegration::where('business_id', $business->id)->delete();
    }

    public function handleOAuthCallback(?string $code, ?string $state): array
    {
        if (!$code || !$state) {
            return ['success' => false, 'message' => 'Parámetros OAuth incompletos'];
        }

        $businessId = Cache::store('file')->pull(self::STATE_PREFIX . $state);
        if (!$businessId) {
            return ['success' => false, 'message' => 'Estado OAuth inválido o expirado'];
        }

        if (!Schema::hasTable('google_integrations')) {
            return ['success' => false, 'message' => 'Falta ejecutar la migración de google_integrations'];
        }

        $business = Business::find($businessId);
        if (!$business) {
            return ['success' => false, 'message' => 'Negocio no encontrado para esta integración'];
        }

        $config = $this->oauthConfig();
        if (!$config['client_id'] || !$config['client_secret'] || !$config['redirect_uri']) {
            return ['success' => false, 'message' => 'Falta configuración de Google OAuth'];
        }

        $tokenResponse = Http::asForm()->timeout(25)->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'redirect_uri' => $config['redirect_uri'],
            'grant_type' => 'authorization_code',
        ]);

        if ($tokenResponse->failed()) {
            return ['success' => false, 'message' => 'No se pudo completar el intercambio de token con Google'];
        }

        $tokenData = $tokenResponse->json();
        $existing = GoogleIntegration::where('business_id', $business->id)->first();
        $accessToken = $tokenData['access_token'] ?? null;

        if (!$accessToken) {
            return ['success' => false, 'message' => 'Google no devolvió un access_token válido'];
        }

        $googleEmail = null;
        $profileResponse = Http::withToken($accessToken)->get('https://www.googleapis.com/oauth2/v2/userinfo');
        if ($profileResponse->ok()) {
            $googleEmail = $profileResponse->json('email');
        }

        GoogleIntegration::updateOrCreate(
            ['business_id' => $business->id],
            [
                'google_email' => $googleEmail,
                'access_token' => $accessToken,
                'refresh_token' => $tokenData['refresh_token'] ?? $existing?->refresh_token,
                'token_type' => $tokenData['token_type'] ?? null,
                'scope' => $tokenData['scope'] ?? null,
                'calendar_id' => 'primary',
                'expires_at' => isset($tokenData['expires_in']) ? now()->addSeconds((int) $tokenData['expires_in']) : null,
            ]
        );

        return ['success' => true, 'message' => 'Google Calendar conectado correctamente'];
    }

    private function oauthConfig(): array
    {
        return [
            'client_id' => env('GOOGLE_CLIENT_ID'),
            'client_secret' => env('GOOGLE_CLIENT_SECRET'),
            'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
            'scopes' => [
                'openid',
                'email',
                'profile',
                'https://www.googleapis.com/auth/calendar.events',
            ],
        ];
    }

    private function getValidAccessToken(int $businessId): ?string
    {
        $integration = GoogleIntegration::where('business_id', $businessId)->first();
        if (!$integration) {
            return null;
        }

        if (!$integration->expires_at || $integration->expires_at->isFuture()) {
            return $integration->access_token;
        }

        if (empty($integration->refresh_token)) {
            return null;
        }

        $config = $this->oauthConfig();
        $refresh = Http::asForm()->timeout(25)->post('https://oauth2.googleapis.com/token', [
            'client_id' => $config['client_id'],
            'client_secret' => $config['client_secret'],
            'refresh_token' => $integration->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if ($refresh->failed()) {
            Log::warning('Google token refresh failed', [
                'business_id' => $businessId,
                'status' => $refresh->status(),
                'body' => $refresh->json(),
            ]);
            return null;
        }

        $data = $refresh->json();
        $integration->access_token = $data['access_token'] ?? $integration->access_token;
        $integration->token_type = $data['token_type'] ?? $integration->token_type;
        $integration->scope = $data['scope'] ?? $integration->scope;
        $integration->expires_at = isset($data['expires_in']) ? now()->addSeconds((int) $data['expires_in']) : $integration->expires_at;
        $integration->save();

        return $integration->access_token;
    }

    private function buildDescription(Appointment $appointment): string
    {
        $lines = [
            'Cita creada desde Skedia',
            'Cliente: ' . $appointment->client_name,
        ];

        if (!empty($appointment->client_phone)) {
            $lines[] = 'Teléfono: ' . $appointment->client_phone;
        }

        if (!empty($appointment->notes)) {
            $lines[] = 'Notas: ' . $appointment->notes;
        }

        return implode("\n", $lines);
    }
}
