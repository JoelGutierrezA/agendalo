<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Obtener el resumen estadístico para el dashboard del dueño de negocio.
     */
    public function summary(Request $request): JsonResponse
    {
        $summary = $this->dashboardService->getBusinessSummary(
            $request->query('start_date'),
            $request->query('end_date')
        );

        return $this->success($summary, 'Resumen cargado con éxito');
    }
}
