<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;

class ExpenseCategoryController extends Controller
{
    /**
     * Listado de categorías de gasto activas del negocio.
     */
    public function index()
    {
        $businessId = request()->user()->business_id;

        $categories = ExpenseCategory::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        return $this->success($categories);
    }

    /**
     * Crea una nueva categoría de gasto.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $businessId = $request->user()->business_id;

        // Evitar duplicados exactos en el mismo negocio
        if (ExpenseCategory::where('business_id', $businessId)->where('name', $request->name)->exists()) {
            return $this->error('La categoría ya existe', 422);
        }

        $category = ExpenseCategory::create([
            'business_id' => $businessId,
            'name'        => $request->name,
            'is_active'   => true,
        ]);

        return $this->success($category, 'Categoría creada', 201);
    }

    /**
     * Actualiza el nombre de una categoría de gasto.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $businessId = $request->user()->business_id;
        $category = ExpenseCategory::where('business_id', $businessId)->findOrFail($id);

        $category->update(['name' => $request->name]);

        return $this->success($category, 'Categoría actualizada');
    }

    /**
     * Elimina / desactiva una categoría.
     * Si la categoría ya tiene gastos asociados, la desactivamos en vez de borrarla para no romper el historial.
     */
    public function destroy($id)
    {
        $businessId = request()->user()->business_id;
        $category = ExpenseCategory::where('business_id', $businessId)->findOrFail($id);

        // TODO: Verificar si tiene ExpenseRecords en la US-9.2, pero por ahora en vez de borrar fuerte, hacemos soft desactivación.
        // O si preferimos borrar: $category->delete();
        // Optaremos por borrar físico si el usuario la creó por error.
        
        $category->delete();

        return $this->success(null, 'Categoría eliminada');
    }
}
