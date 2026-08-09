<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BusinessSetting;
use App\Models\OpeningHour;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function show(Request $request)
    {
        $businessId = $request->user()->business_id;

        $settings = BusinessSetting::firstOrCreate(
            ['business_id' => $businessId],
            [
                'booking_advance_days' => 30,
                'min_booking_notice_hours' => 1,
                'allow_public_booking' => true,
                'booking_confirmation_required' => false,
                'send_client_calendar_invite' => true,
                'time_zone' => 'America/Santiago',
                'currency' => 'CLP',
            ]
        );

        return $this->success($settings, 'Configuración cargada correctamente');
    }

    public function update(Request $request)
    {
        $request->validate([
            'booking_advance_days' => 'sometimes|integer|min:1|max:365',
            'min_booking_notice_hours' => 'sometimes|integer|min:0|max:168',
            'allow_public_booking' => 'sometimes|boolean',
            'booking_confirmation_required' => 'sometimes|boolean',
            'send_client_calendar_invite' => 'sometimes|boolean',
            'time_zone' => 'sometimes|string|max:100',
            'currency' => 'sometimes|string|max:10',
        ]);

        $businessId = $request->user()->business_id;

        $settings = BusinessSetting::firstOrCreate(
            ['business_id' => $businessId],
            [
                'booking_advance_days' => 30,
                'min_booking_notice_hours' => 1,
                'allow_public_booking' => true,
                'booking_confirmation_required' => false,
                'send_client_calendar_invite' => true,
                'time_zone' => 'America/Santiago',
                'currency' => 'CLP',
            ]
        );

        $settings->update($request->only([
            'booking_advance_days',
            'min_booking_notice_hours',
            'allow_public_booking',
            'booking_confirmation_required',
            'send_client_calendar_invite',
            'time_zone',
            'currency',
        ]));

        return $this->success($settings->fresh(), 'Configuración actualizada correctamente');
    }
    
    /**
     * Obtiene los horarios de atención actuales del negocio
     */
    public function openingHours(Request $request) 
    { 
        $businessId = $request->user()->business_id;
        
        $hours = OpeningHour::where('business_id', $businessId)
            ->orderBy('day_of_week')
            ->get();
            
        // Si no existen horarios generamos una plantilla vacía para el frontend en memoria
        if ($hours->isEmpty()) {
            $hours = collect([1, 2, 3, 4, 5, 6, 0])->map(function($day) use ($businessId) {
                return [
                    'business_id' => $businessId,
                    'day_of_week' => $day,
                    'is_open' => ($day != 0), // Domingo cerrado por defecto
                    'open_time' => ($day != 0) ? '09:00:00' : null,
                    'close_time' => ($day != 0) ? '18:00:00' : null,
                ];
            });
        }
        
        return $this->success($hours); 
    }
    
    /**
     * Sobrescribe los 7 horarios de la semana
     */
    public function updateOpeningHours(Request $request) 
    { 
        $request->validate([
            'hours' => 'required|array|size:7',
            'hours.*.day_of_week' => 'required|integer|between:0,6',
            'hours.*.is_open' => 'required|boolean',
            'hours.*.open_time' => 'nullable|date_format:H:i|required_if:hours.*.is_open,true',
            'hours.*.close_time' => 'nullable|date_format:H:i|required_if:hours.*.is_open,true|after:hours.*.open_time',
        ], [
            'hours.*.close_time.after' => 'La hora de cierre debe ser posterior a la hora de apertura.'
        ]);

        $businessId = $request->user()->business_id;

        DB::beginTransaction();
        try {
            foreach ($request->hours as $hourData) {
                OpeningHour::updateOrCreate(
                    [
                        'business_id' => $businessId,
                        'day_of_week' => $hourData['day_of_week'],
                    ],
                    [
                        'is_open' => $hourData['is_open'],
                        // Aseguramos que guarde H:i formato aunque venga H:i:s
                        'open_time' => $hourData['is_open'] ? date('H:i', strtotime($hourData['open_time'])) : null,
                        'close_time' => $hourData['is_open'] ? date('H:i', strtotime($hourData['close_time'])) : null,
                    ]
                );
            }
            DB::commit();

            return $this->success(null, 'Horarios de atención guardados correctamente.');
            
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Error al guardar los horarios: ' . $e->getMessage(), 500);
        }
    }
}
