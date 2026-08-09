<?php

namespace App\Http\Controllers\PublicBooking;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Service;
use App\Models\Appointment;
use App\Models\Client;
use App\Services\GoogleCalendarService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PublicBookingController extends Controller
{
    public function __construct(private readonly GoogleCalendarService $googleCalendarService)
    {
    }

    /**
     * Datos públicos del negocio.
     */
    public function show($slug)
    {
        $business = Business::where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();

        return $this->success([
            'id' => $business->id,
            'name' => $business->name,
            'description' => $business->description,
            'address' => $business->address,
            'phone' => $business->phone,
            'email' => $business->email,
            'city' => $business->city,
            'country' => $business->country,
        ]);
    }

    /**
     * Servicios activos del negocio.
     */
    public function services($slug)
    {
        $business = Business::where('slug', $slug)->firstOrFail();
        
        $services = Service::where('business_id', $business->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success($services);
    }

    /**
     * Consultar horarios disponibles para una fecha y servicio específico.
     */
    public function availability(Request $request, $slug)
    {
        $request->validate([
            'date' => 'required|date_format:Y-m-d',
            'service_id' => 'required|exists:services,id'
        ]);

        $business = Business::where('slug', $slug)->firstOrFail();
        $date = $request->date;
        $service = Service::findOrFail($request->service_id);

        $carbonDate = Carbon::createFromFormat('Y-m-d', $date);
        $dayOfWeek = $carbonDate->dayOfWeek; // 0=Domingo, 1=Lunes

        // 1. Obtener horario del negocio para ese día
        $openingHour = DB::table('opening_hours')
            ->where('business_id', $business->id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        // Si no hay configuración o está marcado como cerrado, no hay disponibilidad
        if (!$openingHour || !$openingHour->is_open || !$openingHour->open_time || !$openingHour->close_time) {
            return $this->success([], 'Negocio cerrado este día');
        }

        $openTime = $openingHour->open_time;
        $closeTime = $openingHour->close_time;

        // 2. Obtener todas las citas que ocurren en ese día para ese negocio
        $appointments = Appointment::where('business_id', $business->id)
            ->whereDate('scheduled_at', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        $slots = [];
        $start = Carbon::createFromFormat('Y-m-d H:i:s', "$date $openTime");
        $end = Carbon::createFromFormat('Y-m-d H:i:s', "$date $closeTime");
        
        $duration = $service->duration_minutes;

        // Generar slots
        while ($start->copy()->addMinutes($duration)->lte($end)) {
            $slotStart = $start->copy();
            $slotEnd = $start->copy()->addMinutes($duration);
            
            // Ignorar slots en el pasado si es el día de hoy
            if ($slotStart->isPast()) {
                $start->addMinutes(30);
                continue;
            }

            $isAvailable = true;

            // Revisar cruce con citas existentes
            foreach ($appointments as $app) {
                $appStart = Carbon::parse($app->scheduled_at);
                $appEnd = $appStart->copy()->addMinutes($app->duration_minutes);

                // Lógica de intersección de rangos: A_start < B_end && B_start < A_end
                if ($slotStart->lt($appEnd) && $appStart->lt($slotEnd)) {
                    $isAvailable = false;
                    break;
                }
            }

            if ($isAvailable) {
                $slots[] = $slotStart->format('H:i');
            }

            // Intervalo entre slots
            $start->addMinutes(30);
        }

        return $this->success($slots);
    }

    /**
     * Procesar y crear la reserva pública.
     */
    public function book(Request $request, $slug)
    {
        $request->validate([
            'service_id' => 'required|exists:services,id',
            'date' => 'required|date_format:Y-m-d',
            'time' => 'required|date_format:H:i',
            'client_name' => 'required|string|max:255',
            'client_email' => 'required|email|max:255',
            'client_phone' => 'required|string|max:50',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($request, $slug) {
            $business = Business::where('slug', $slug)->firstOrFail();
            $service = Service::where('business_id', $business->id)->findOrFail($request->service_id);

            // 1. Validar que la hora seleccionada esté dentro del horario de atención
            $scheduledAt = Carbon::createFromFormat('Y-m-d H:i', "{$request->date} {$request->time}");
            $dayOfWeek = $scheduledAt->dayOfWeek;

            $openingHour = DB::table('opening_hours')
                ->where('business_id', $business->id)
                ->where('day_of_week', $dayOfWeek)
                ->first();

            if (!$openingHour || !$openingHour->is_open) {
                return $this->error('El negocio no atiende en este día.', 422);
            }

            $openTime = Carbon::createFromFormat('Y-m-d H:i:s', "{$request->date} {$openingHour->open_time}");
            $closeTime = Carbon::createFromFormat('Y-m-d H:i:s', "{$request->date} {$openingHour->close_time}");
            $endsAt = $scheduledAt->copy()->addMinutes($service->duration_minutes);

            if ($scheduledAt->lt($openTime) || $endsAt->gt($closeTime)) {
                return $this->error('La cita está fuera del horario de atención del negocio.', 422);
            }

            // 2. Validar que el slot no esté ocupado
            $conflicting = Appointment::where('business_id', $business->id)
                ->whereDate('scheduled_at', $request->date)
                ->whereIn('status', ['pending', 'confirmed'])
                ->get()
                ->filter(function($app) use ($scheduledAt, $endsAt) {
                    $appStart = Carbon::parse($app->scheduled_at);
                    $appEnd = $appStart->copy()->addMinutes($app->duration_minutes);
                    return $scheduledAt->lt($appEnd) && $appStart->lt($endsAt);
                });

            if ($conflicting->isNotEmpty()) {
                return $this->error('Este horario ya no está disponible. Por favor elige otro.', 422);
            }

            // 3. Verificar o crear cliente
            $client = Client::firstOrCreate(
                ['business_id' => $business->id, 'email' => $request->client_email],
                ['name' => $request->client_name, 'phone' => $request->client_phone]
            );

            // 4. Crear la cita
            $appointment = Appointment::create([
                'business_id' => $business->id,
                'client_id' => $client->id,
                'service_id' => $service->id,
                'client_name' => $request->client_name,
                'client_email' => $request->client_email,
                'client_phone' => $request->client_phone,
                'scheduled_at' => $scheduledAt,
                'duration_minutes' => $service->duration_minutes,
                'status' => 'pending',
                'notes' => $request->notes,
                'is_from_public' => true,
            ]);

            try {
                $this->googleCalendarService->syncAppointment($appointment->fresh(['business.settings', 'service']));
            } catch (\Throwable $e) {
                Log::warning('Google sync failed on public booking create', [
                    'appointment_id' => $appointment->id,
                    'error' => $e->getMessage(),
                ]);
            }

            return $this->success([
                'id' => $appointment->id,
                'status' => $appointment->status,
                'scheduled_at' => $scheduledAt->format('Y-m-d H:i:s')
            ], 'Reserva creada con éxito', 201);
        });
    }

    /**
     * Endpoint de confirmación de página.
     */
    public function confirmation($id)
    {
        // Esto sería para pintar el resumen en la vista de gracias
        $appointment = Appointment::with(['business', 'service'])->findOrFail($id);
        
        return $this->success([
            'business_name' => $appointment->business->name,
            'service_name' => $appointment->service->name ?? 'Servicio',
            'client_name' => $appointment->client_name,
            'scheduled_at' => $appointment->scheduled_at,
            'status' => $appointment->status
        ]);
    }
}
