<?php

namespace App\Http\Controllers\Appointments;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Client;
use App\Models\IncomeRecord;
use App\Models\Service;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AppointmentController extends Controller
{
    public function __construct(private readonly GoogleCalendarService $googleCalendarService)
    {
    }

    /**
     * Listado de citas con filtros.
     */
    public function index(Request $request)
    {
        $query = Appointment::with(['client', 'service']);

        $request->validate([
            'sort_by' => 'nullable|in:scheduled_at,created_at',
            'sort_dir' => 'nullable|in:asc,desc',
        ]);

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        if ($request->has('date') && $request->date !== '') {
            $query->whereDate('scheduled_at', $request->date);
        }
        
        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('client_name', 'like', "%{$search}%")
                  ->orWhere('client_email', 'like', "%{$search}%")
                  ->orWhere('client_phone', 'like', "%{$search}%");
            });
        }

        $sortBy = $request->input('sort_by', 'scheduled_at');
        $sortDir = $request->input('sort_dir', 'desc');

        return $this->success($query->orderBy($sortBy, $sortDir)->paginate(20));
    }

    /**
     * Crear una nueva cita (manual desde el panel).
     */
    public function store(Request $request)
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'service_id' => 'required|exists:services,id',
            'scheduled_at' => 'required|date',
            'status' => 'required|in:pending,confirmed',
            'notes' => 'nullable|string'
        ]);

        $businessId = Auth::user()->business_id;
        $businessTimezone = $this->resolveBusinessTimezone($businessId);

        $scheduledAt = $this->parseBusinessDateTime($request->scheduled_at, $businessTimezone);
        $scheduledAtUtc = $this->toUtc($scheduledAt);

        $service = Service::findOrFail($request->service_id);

        if (!$this->validateOpeningHours($businessId, $scheduledAt, $service->duration_minutes, $businessTimezone)) {
            return $this->error('La cita está fuera del horario de atención configurado para el negocio.', 422);
        }

        if ($this->hasScheduleConflict($businessId, $scheduledAtUtc, $service->duration_minutes, null)) {
            return $this->error('Este horario ya está reservado. Elige otro turno disponible.', 422);
        }

        // Vincular o crear cliente automáticamente si hay email
        $clientId = null;
        if ($request->filled('client_email')) {
            $client = Client::firstOrCreate(
                ['business_id' => $businessId, 'email' => $request->client_email],
                ['name' => $request->client_name, 'phone' => $request->client_phone]
            );
            $clientId = $client->id;
        }

        $appointment = Appointment::create(array_merge($request->all(), [
            'business_id' => $businessId,
            'client_id' => $clientId,
            'scheduled_at' => $scheduledAtUtc->toDateTimeString(),
            'duration_minutes' => $service->duration_minutes
        ]));

        try {
            $this->googleCalendarService->syncAppointment($appointment->fresh(['business.settings', 'service']));
        } catch (\Throwable $e) {
            Log::warning('Google sync failed on appointment store', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->success($appointment->load('service'), 'Cita creada exitosamente', 201);
    }

    /**
     * Mostrar una cita específica.
     */
    public function show(Appointment $appointment)
    {
        $this->authorize('view', $appointment);
        return $this->success($appointment->load(['client', 'service']));
    }

    /**
     * Actualizar una cita completamente.
     */
    public function update(Request $request, Appointment $appointment)
    {
        $request->validate([
            'client_name' => 'sometimes|required|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'service_id' => 'sometimes|required|exists:services,id',
            'scheduled_at' => 'sometimes|required|date',
            'status' => 'sometimes|required|in:pending,confirmed,completed,cancelled,no_show',
            'notes' => 'nullable|string'
        ]);

        $businessId = Auth::user()->business_id;
        $businessTimezone = $this->resolveBusinessTimezone($businessId);

        $nextScheduledAt = $request->has('scheduled_at')
            ? $this->parseBusinessDateTime($request->scheduled_at, $businessTimezone)
            : $appointment->scheduled_at->copy()->setTimezone($businessTimezone);

        $nextScheduledAtUtc = $this->toUtc($nextScheduledAt);

        $nextDurationMinutes = $request->has('service_id')
            ? Service::findOrFail($request->service_id)->duration_minutes
            : $appointment->duration_minutes;

        $nextStatus = $request->input('status', $appointment->status);
        $isScheduleMutation = $request->has('scheduled_at') || $request->has('service_id');

        if ($isScheduleMutation && $nextStatus !== 'cancelled') {
            if (!$this->validateOpeningHours($businessId, $nextScheduledAt, $nextDurationMinutes, $businessTimezone)) {
                return $this->error('La cita está fuera del horario de atención configurado para el negocio.', 422);
            }

            if ($this->hasScheduleConflict($businessId, $nextScheduledAtUtc, $nextDurationMinutes, $appointment->id)) {
                return $this->error('Este horario ya está reservado. Elige otro turno disponible.', 422);
            }
        }

        if ($request->has('service_id') && $request->service_id != $appointment->service_id) {
            $appointment->duration_minutes = $nextDurationMinutes;
        }

        if ($request->has('scheduled_at')) {
            $request->merge(['scheduled_at' => $nextScheduledAtUtc->toDateTimeString()]);
        }

        // Si se actualizan datos del cliente, intentar re-vincular o actualizar
        if ($request->filled('client_email')) {
            $businessId = Auth::user()->business_id;
            $client = Client::firstOrCreate(
                ['business_id' => $businessId, 'email' => $request->client_email],
                ['name' => $request->client_name, 'phone' => $request->client_phone]
            );
            $appointment->client_id = $client->id;
        }

        $this->authorize('update', $appointment);
        $appointment->update($request->all());

        try {
            $this->googleCalendarService->syncAppointment($appointment->fresh(['business.settings', 'service']));
        } catch (\Throwable $e) {
            Log::warning('Google sync failed on appointment update', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }

        return $this->success($appointment->fresh(['client', 'service']), 'Cita actualizada exitosamente');
    }

    /**
     * Eliminar (cancelar/borrar) una cita.
     */
    public function destroy(Appointment $appointment)
    {
        $this->authorize('delete', $appointment);

        try {
            $this->googleCalendarService->deleteAppointmentEvent($appointment->loadMissing('business'));
        } catch (\Throwable $e) {
            Log::warning('Google delete failed on appointment destroy', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);
        }

        $appointment->delete();
        return $this->success(null, 'Cita eliminada');
    }

    /**
     * Actualizar estado de la cita (confirmar, cancelar, completar).
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        $request->validate(['status' => 'required|in:confirmed,completed,cancelled,no_show']);

        return DB::transaction(function () use ($request, $appointment) {
            $this->authorize('update', $appointment);
            $oldStatus = $appointment->status;
            $appointment->update(['status' => $request->status]);

            try {
                if ($request->status === 'cancelled') {
                    $this->googleCalendarService->deleteAppointmentEvent($appointment->loadMissing('business'));
                } else {
                    $this->googleCalendarService->syncAppointment($appointment->fresh(['business.settings', 'service']));
                }
            } catch (\Throwable $e) {
                Log::warning('Google sync failed on appointment status update', [
                    'appointment_id' => $appointment->id,
                    'status' => $request->status,
                    'error' => $e->getMessage(),
                ]);
            }

            // Si se completa y no estaba completada antes, registrar ingreso automático si tiene precio
            if ($request->status === 'completed' && $oldStatus !== 'completed' && $appointment->service) {
                IncomeRecord::create([
                    'business_id' => $appointment->business_id,
                    'appointment_id' => $appointment->id,
                    'description' => "Cita #{$appointment->id} - {$appointment->client_name}",
                    'amount' => $appointment->service->price,
                    'recorded_at' => now(),
                ]);
            }

            return $this->success($appointment->fresh(['service', 'client']), "Cita actualizada a {$request->status}");
        });
    }

    /**
     * Vista de calendario (eventos para FullCalendar).
     */
    public function calendar(Request $request)
    {
        $request->validate([
            'start' => 'required|date',
            'end' => 'required|date',
        ]);

        $start = Carbon::parse($request->start);
        $end = Carbon::parse($request->end);

        $appointments = Appointment::with('service')->whereBetween('scheduled_at', [$start, $end])->get();

        $events = $appointments
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'title' => $app->client_name . ' - ' . ($app->service->name ?? 'Servicio'),
                    'start' => $app->scheduled_at->toIso8601String(),
                    'end' => $app->scheduled_at->copy()->addMinutes($app->duration_minutes)->toIso8601String(),
                    'backgroundColor' => $this->getStatusColor($app->status),
                    'extendedProps' => [
                        'status' => $app->status,
                        'client_name' => $app->client_name,
                        'service_name' => $app->service->name ?? 'Servicio',
                        'source' => 'skedia',
                        'read_only' => false,
                    ]
                ];
            });

        $business = Auth::user()?->business;
        $googleEvents = [];
        if ($business) {
            $googleEvents = $this->googleCalendarService->getReadOnlyEventsForRange(
                $business,
                $start,
                $end,
                $appointments->pluck('google_event_id')->filter()->values()->all()
            );
        }

        $combined = $events->concat($googleEvents)->sortBy('start')->values();

        return $this->success($combined);
    }

    private function getStatusColor(string $status): string
    {
        return match ($status) {
            'confirmed' => '#3B82F6',
            'pending' => '#F59E0B',
            'completed' => '#10B981',
            'cancelled' => '#EF4444',
            default => '#94A3B8',
        };
    }

    /**
     * Valida si una fecha/hora está dentro de los horarios de atención.
     */
    private function validateOpeningHours(int $businessId, Carbon $dateTime, int $durationMinutes, string $businessTimezone): bool
    {
        $localDateTime = $dateTime->copy()->setTimezone($businessTimezone);
        $dayOfWeek = $localDateTime->dayOfWeek;

        $openingHour = DB::table('opening_hours')
            ->where('business_id', $businessId)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (!$openingHour || !$openingHour->is_open) {
            return false;
        }

        // Si es apertura libre (null), permitimos, pero usualmente tendrán valores
        if (!$openingHour->open_time || !$openingHour->close_time) {
            return true;
        }

        $openAt = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $localDateTime->toDateString() . ' ' . $openingHour->open_time,
            $businessTimezone
        );

        $closeAt = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $localDateTime->toDateString() . ' ' . $openingHour->close_time,
            $businessTimezone
        );

        $endsAt = $localDateTime->copy()->addMinutes(max(0, $durationMinutes));

        return !$localDateTime->lt($openAt) && !$endsAt->gt($closeAt);
    }

    private function resolveBusinessTimezone(int $businessId): string
    {
        return DB::table('business_settings')
            ->where('business_id', $businessId)
            ->value('time_zone')
            ?: 'America/Santiago';
    }

    private function parseBusinessDateTime(string $rawDateTime, string $businessTimezone): Carbon
    {
        $hasTimezoneInfo = (bool) preg_match('/(Z|[+\-]\d{2}:\d{2})$/', $rawDateTime);

        if ($hasTimezoneInfo) {
            return Carbon::parse($rawDateTime)->setTimezone($businessTimezone);
        }

        return Carbon::parse($rawDateTime, $businessTimezone);
    }

    private function hasScheduleConflict(
        int $businessId,
        Carbon $startAtUtc,
        int $durationMinutes,
        ?int $ignoreAppointmentId
    ): bool {
        $startUtc = $this->toUtc($startAtUtc);
        $endUtc = $startUtc->copy()->addMinutes(max(0, $durationMinutes));

        $query = Appointment::query()
            ->where('business_id', $businessId)
            ->where('status', '!=', 'cancelled')
            ->where('scheduled_at', '<', $endUtc->toDateTimeString())
            ->whereRaw(
                'DATE_ADD(scheduled_at, INTERVAL duration_minutes MINUTE) > ?',
                [$startUtc->toDateTimeString()]
            );

        if ($ignoreAppointmentId) {
            $query->where('id', '!=', $ignoreAppointmentId);
        }

        return $query->exists();
    }

    private function toUtc(Carbon $dateTime): Carbon
    {
        return $dateTime->copy()->setTimezone('UTC');
    }
}
