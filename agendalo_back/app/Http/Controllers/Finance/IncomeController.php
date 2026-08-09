<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\IncomeRecord;
use Illuminate\Http\Request;

class IncomeController extends Controller
{
    /**
     * Listado de ingresos (manuales y automáticos).
     * Se puede filtrar por rango de fechas (mes actual por defecto).
     */
    public function index(Request $request)
    {
        $businessId = request()->user()->business_id;
        $query = IncomeRecord::where('business_id', $businessId)->with('appointment');

        // Filtrado por fecha (desde - hasta)
        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('recorded_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('recorded_at', '<=', $request->end_date);
        }

        $incomes = $query->orderByDesc('recorded_at')->orderByDesc('id')->paginate(15);
        
        return $this->success($incomes);
    }

    /**
     * Registrar un ingreso de dinero de forma manual.
     */
    public function store(Request $request)
    {
        $request->validate([
            'description'    => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0.01',
            'recorded_at'    => 'required|date',
            'notes'          => 'nullable|string',
            'appointment_id' => 'nullable|exists:appointments,id',
        ]);

        $businessId = $request->user()->business_id;

        $income = IncomeRecord::create([
            'business_id'    => $businessId,
            'description'    => $request->description,
            'amount'         => $request->amount,
            'recorded_at'    => $request->recorded_at,
            'notes'          => $request->notes,
            'appointment_id' => $request->appointment_id,
        ]);

        return $this->success($income, 'Ingreso registrado correctamente', 201);
    }

    /**
     * Ver detalles de un ingreso.
     */
    public function show(IncomeRecord $income)
    {
        $this->authorize('view', $income);
        return $this->success($income->load('appointment'));
    }

    /**
     * Actualiza los datos de un ingreso existente.
     */
    public function update(Request $request, IncomeRecord $income)
    {
        $request->validate([
            'description'    => 'required|string|max:255',
            'amount'         => 'required|numeric|min:0.01',
            'recorded_at'    => 'required|date',
            'notes'          => 'nullable|string',
        ]);

        $this->authorize('update', $income);

        $income->update([
            'description' => $request->description,
            'amount'      => $request->amount,
            'recorded_at' => $request->recorded_at,
            'notes'       => $request->notes,
        ]);

        return $this->success($income, 'Ingreso actualizado');
    }

    /**
     * Eliminar un ingreso manual (por error de tipeo por ejemplo).
     */
    public function destroy(IncomeRecord $income)
    {
        $this->authorize('delete', $income);
        $income->delete();

        return $this->success(null, 'Ingreso eliminado');
    }
}
