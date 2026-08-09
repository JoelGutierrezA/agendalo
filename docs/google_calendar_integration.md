# Agéndalo — Integración con Google Calendar

## Objetivo

Permitir que el dueño del negocio conecte su Google Calendar para que cada cita creada en Agéndalo se sincronice automáticamente como evento de calendario.

> **Estado en Fase 0 / MVP:** Estructura técnica preparada. No implementado. La UI muestra la sección con badge "Próximamente".

---

## Flujo OAuth

```
1. Dueño va a Configuración → Google Calendar
2. Hace clic en "Conectar Google Calendar"
3. Backend genera URL de autorización OAuth
4. Dueño es redirigido a Google para autorizar
5. Google redirige al callback del backend
6. Backend recibe código de autorización
7. Backend intercambia código por access_token y refresh_token
8. Tokens almacenados (cifrados) en tabla google_integrations
9. Negocio queda marcado como "Google Calendar conectado"
```

---

## Endpoints Preparados

```
GET  /api/v1/google/auth-url      ← Genera y retorna URL de autorización
GET  /api/v1/google/callback      ← Recibe código de Google (redirect)
GET  /api/v1/google/status        ← Estado de la integración del negocio
DELETE /api/v1/google/disconnect  ← Revoca tokens y desconecta
```

---

## Scopes de Google Calendar necesarios

```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

---

## Almacenamiento de Tokens

Los tokens OAuth deben almacenarse en la tabla `google_integrations`:

```php
// En el modelo GoogleIntegration
protected $casts = [
    'access_token'  => 'encrypted', // Cifrado automático por Laravel
    'refresh_token' => 'encrypted',
    'token_expires_at' => 'datetime',
];
```

**Nunca** almacenar tokens en texto plano.

---

## Servicio Placeholder: GoogleCalendarService

```php
// app/Services/GoogleCalendarService.php

class GoogleCalendarService
{
    /**
     * Genera la URL de autorización OAuth de Google.
     * TODO: Implementar con google/apiclient
     */
    public function getAuthUrl(Business $business): string
    {
        // TODO: Implementar OAuth flow
        throw new \LogicException('Google Calendar integration not yet implemented.');
    }

    /**
     * Maneja el callback OAuth y guarda tokens.
     * TODO: Implementar intercambio de código por tokens
     */
    public function handleCallback(string $code, Business $business): GoogleIntegration
    {
        // TODO: Implementar
    }

    /**
     * Crea un evento en Google Calendar al crear cita.
     * TODO: Implementar con google/apiclient
     */
    public function createEvent(Appointment $appointment): ?string
    {
        // Retorna el google_event_id
        // TODO: Implementar
        return null;
    }

    /**
     * Actualiza un evento existente al reagendar cita.
     */
    public function updateEvent(Appointment $appointment): void
    {
        // TODO: Implementar
    }

    /**
     * Cancela/elimina un evento al cancelar cita.
     */
    public function cancelEvent(Appointment $appointment): void
    {
        // TODO: Implementar
    }
}
```

---

## Puntos de Integración en AppointmentService

```php
class AppointmentService
{
    public function __construct(
        private GoogleCalendarService $calendar
    ) {}

    public function create(array $data, Business $business): Appointment
    {
        $appointment = Appointment::create([...]);

        // TODO (Fase 2): Si el negocio tiene Google Calendar conectado, crear evento
        // if ($business->googleIntegration?->is_active) {
        //     $eventId = $this->calendar->createEvent($appointment);
        //     $appointment->update(['google_event_id' => $eventId]);
        // }

        return $appointment;
    }

    public function reschedule(Appointment $appointment, array $data): Appointment
    {
        $appointment->update($data);

        // TODO (Fase 2): Actualizar evento en Google Calendar
        // if ($appointment->google_event_id) {
        //     $this->calendar->updateEvent($appointment);
        // }

        return $appointment;
    }

    public function cancel(Appointment $appointment): Appointment
    {
        $appointment->update(['status' => 'cancelled', 'cancelled_at' => now()]);

        // TODO (Fase 2): Cancelar evento en Google Calendar
        // if ($appointment->google_event_id) {
        //     $this->calendar->cancelEvent($appointment);
        // }

        return $appointment;
    }
}
```

---

## Dependencias PHP necesarias (Fase 2)

```bash
composer require google/apiclient:^2.0
```

---

## Configuración de Google Cloud Console (Fase 2)

1. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilitar la API de Google Calendar
3. Crear credenciales tipo "OAuth 2.0 Client ID" (tipo "Web application")
4. Configurar Redirect URI: `https://api.agendalo.app/api/v1/google/callback`
5. Copiar `Client ID` y `Client Secret` al `.env`

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://api.agendalo.app/api/v1/google/callback
```

---

## Consideraciones Adicionales (Futuro)

- **Invitación al cliente:** Al crear cita, si el cliente tiene email, Google envía invitación automáticamente como attendee del evento.
- **Refresh token automático:** El servicio debe renovar el access_token antes de que expire usando el refresh_token.
- **Manejo de errores de API:** Si Google Calendar falla, la cita se crea igual en Agéndalo (no bloquear el flujo principal).
- **Logs de sincronización:** Registrar eventos de sincronización para diagnóstico.
