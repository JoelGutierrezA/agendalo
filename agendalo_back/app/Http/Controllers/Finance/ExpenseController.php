<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\ExpenseRecord;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * Listado de egresos.
     * Soporta filtros por fecha y por categoría de gasto.
     */
    public function index(Request $request)
    {
        $businessId = request()->user()->business_id;
        $query = ExpenseRecord::where('business_id', $businessId)->with('category');

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('recorded_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('recorded_at', '<=', $request->end_date);
        }
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        $expenses = $query->orderByDesc('recorded_at')->orderByDesc('id')->paginate(15);
        
        return $this->success($expenses);
    }

    /**
     * Registra un nuevo gasto (egreso).
     */
    public function store(Request $request)
    {
        $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'description' => 'required|string|max:255',
            'amount'      => 'required|numeric|min:0.01',
            'recorded_at' => 'required|date',
            'notes'       => 'nullable|string',
        ]);

        $businessId = $request->user()->business_id;

        // Validar que la categoría pertenezca a este negocio
        \App\Models\ExpenseCategory::where('business_id', $businessId)
            ->findOrFail($request->category_id);

        $expense = ExpenseRecord::create([
            'business_id' => $businessId,
            'category_id' => $request->category_id,
            'description' => $request->description,
            'amount'      => $request->amount,
            'recorded_at' => $request->recorded_at,
            'notes'       => $request->notes,
        ]);

        return $this->success($expense->load('category'), 'Egreso registrado correctamente', 201);
    }

    /**
     * Detalle de un egreso específico.
     */
    public function show(ExpenseRecord $expense)
    {
        $this->authorize('view', $expense);
        return $this->success($expense->load('category'));
    }

    /**
     * Edita / Actualiza un gasto.
     */
    public function update(Request $request, ExpenseRecord $expense)
    {
        $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'description' => 'required|string|max:255',
            'amount'      => 'required|numeric|min:0.01',
            'recorded_at' => 'required|date',
            'notes'       => 'nullable|string',
        ]);

        $this->authorize('update', $expense);

        $businessId = $request->user()->business_id;
        
        \App\Models\ExpenseCategory::where('business_id', $businessId)
            ->findOrFail($request->category_id);

        $expense->update([
            'category_id' => $request->category_id,
            'description' => $request->description,
            'amount'      => $request->amount,
            'recorded_at' => $request->recorded_at,
            'notes'       => $request->notes,
        ]);

        return $this->success($expense->load('category'), 'Egreso actualizado');
    }

    /**
     * Borra un gasto del historial.
     */
    public function destroy(ExpenseRecord $expense)
    {
        $this->authorize('delete', $expense);
        $expense->delete();

        return $this->success(null, 'Egreso eliminado exitosamente');
    }
}
