<?php

namespace App\Services\Dashboard;

use App\Models\Appointment;
use App\Models\IncomeRecord;
use App\Models\ExpenseRecord;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class DashboardService
{
    public function getBusinessSummary(?string $startDate = null, ?string $endDate = null): array
    {
        $businessId = Auth::user()->business_id;

        if (!$businessId) {
            return [
                'kpis' => [
                    'monthly_income' => 0.0,
                    'monthly_expenses' => 0.0,
                    'monthly_balance' => 0.0,
                    'today_appointments' => 0,
                    'pending_appointments' => 0,
                ],
                'total_revenue' => 0.0,
                'total_expenses' => 0.0,
                'total_balance' => 0.0,
                'upcoming_appointments' => [],
                'chart_data' => [
                    'labels' => [],
                    'income' => [],
                    'appointments' => [],
                ],
                'period' => null,
            ];
        }

        $today = Carbon::today();
        $periodStart = $startDate ? Carbon::parse($startDate)->startOfDay() : Carbon::now()->startOfMonth();
        $periodEnd = $endDate ? Carbon::parse($endDate)->endOfDay() : Carbon::now()->endOfMonth();

        // 1. KPIs Financieros (Periodo)
        $monthlyIncome = IncomeRecord::where('business_id', $businessId)
            ->whereBetween('recorded_at', [$periodStart, $periodEnd])
            ->sum('amount');

        $monthlyExpenses = ExpenseRecord::where('business_id', $businessId)
            ->whereBetween('recorded_at', [$periodStart, $periodEnd])
            ->sum('amount');

        // 2. KPIs de Citas
        $todayAppointments = Appointment::where('business_id', $businessId)
            ->whereDate('scheduled_at', $today)
            ->count();
            
        $pendingAppointments = Appointment::where('business_id', $businessId)
            ->where('status', 'pending')
            ->count();

        // 3. Próximas 5 citas
        $upcomingAppointments = Appointment::where('business_id', $businessId)
            ->where('scheduled_at', '>=', Carbon::now())
            ->whereIn('status', ['pending', 'confirmed'])
            ->with('service')
            ->orderBy('scheduled_at', 'asc')
            ->limit(5)
            ->get()
            ->map(function($apt) {
                return [
                    'id' => $apt->id,
                    'client_name' => $apt->client_name,
                    'service_name' => $apt->service->name ?? 'Servicio',
                    'time' => Carbon::parse($apt->scheduled_at)->format('H:i'),
                    'status' => $apt->status
                ];
            });

        // 4. Datos para Gráfico (Últimos 7 días)
        $chartData = $this->getChartData($businessId);

        return [
            'kpis' => [
                'monthly_income' => (float)$monthlyIncome,
                'monthly_expenses' => (float)$monthlyExpenses,
                'monthly_balance' => (float)($monthlyIncome - $monthlyExpenses),
                'today_appointments' => $todayAppointments,
                'pending_appointments' => $pendingAppointments,
            ],
            // Compatibilidad con consumidores legacy (Finanzas)
            'total_revenue' => (float)$monthlyIncome,
            'total_expenses' => (float)$monthlyExpenses,
            'total_balance' => (float)($monthlyIncome - $monthlyExpenses),
            'upcoming_appointments' => $upcomingAppointments,
            'chart_data' => $chartData,
            'period' => [
                'start_date' => $periodStart->toDateString(),
                'end_date' => $periodEnd->toDateString(),
            ],
        ];
    }

    private function getChartData($businessId): array
    {
        $days = [];
        $incomeData = [];
        $appointmentsData = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->format('Y-m-d');
            $days[] = $date->isoFormat('ddd');

            $incomeData[] = (float)IncomeRecord::where('business_id', $businessId)
                ->whereDate('recorded_at', $date)
                ->sum('amount');

            $appointmentsData[] = Appointment::where('business_id', $businessId)
                ->whereDate('scheduled_at', $date)
                ->count();
        }

        return [
            'labels' => $days,
            'income' => $incomeData,
            'appointments' => $appointmentsData
        ];
    }
}
