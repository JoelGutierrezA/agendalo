<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Supply;
use App\Models\SupplyTransaction;
use App\Models\ExpenseRecord;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplyController extends Controller
{
    /**
     * Catálogo rápido de Insumos del negocio
     */
    public function getCatalog(Request $request)
    {
        $businessId = $request->user()->business_id;
        $supplies = Supply::where('business_id', $businessId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get();
            
        return $this->success($supplies);
    }

    /**
     * Crear un nuevo insumo base en el catálogo
     */
    public function storeCatalogItem(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string'
        ]);

        $businessId = $request->user()->business_id;

        if (Supply::where('business_id', $businessId)->where('name', $request->name)->exists()) {
            return $this->error('Este insumo ya existe en el catálogo', 422);
        }

        $supply = Supply::create([
            'business_id' => $businessId,
            'name'        => $request->name,
            'description' => $request->description,
            'is_active'   => true,
        ]);

        return $this->success($supply, 'Insumo agregado al catálogo', 201);
    }

    /**
     * Listado paginado del historial de compras
     */
    public function indexPurchases(Request $request)
    {
        $businessId = request()->user()->business_id;
        
        $purchases = SupplyTransaction::with('supply')
            ->where('business_id', $businessId)
            ->orderByDesc('purchased_at')
            ->orderByDesc('id')
            ->paginate(15);
            
        return $this->success($purchases);
    }

    /**
     * Registrar una COMPRA de insumo. 
     * Impacta automáticamente en los EGRESOS Financieros (ExpenseRecord).
     */
    public function storePurchase(Request $request)
    {
        $request->validate([
            'supply_id'    => 'required|exists:supplies,id',
            'quantity'     => 'required|numeric|min:0.01',
            'unit_cost'    => 'required|numeric|min:0',
            'purchased_at' => 'required|date',
            'notes'        => 'nullable|string',
        ]);

        $businessId = $request->user()->business_id;
        $totalCost = $request->quantity * $request->unit_cost;

        // Verificar que el supply pertenezca a mi negocio
        $supply = Supply::where('business_id', $businessId)->findOrFail($request->supply_id);

        DB::beginTransaction();
        try {
            // 1. Obtener o crear una Categoría general "Compras de Insumos"
            $category = ExpenseCategory::firstOrCreate(
                ['business_id' => $businessId, 'name' => 'Compra de Insumos'],
                ['is_active' => true]
            );

            // 2. Registrar el Egreso Financiero
            $expense = ExpenseRecord::create([
                'business_id' => $businessId,
                'category_id' => $category->id,
                'description' => 'Compra de Insumo: ' . $supply->name . ' (Cant: ' . $request->quantity . ')',
                'amount'      => $totalCost,
                'recorded_at' => $request->purchased_at,
                'notes'       => 'Generado automáticamente desde Insumos. ' . $request->notes,
            ]);

            // 3. Registrar la Compra en Inventario atada al Egreso
            $purchase = SupplyTransaction::create([
                'business_id'       => $businessId,
                'supply_id'         => $supply->id,
                'quantity'          => $request->quantity,
                'unit_cost'         => $request->unit_cost,
                'total_cost'        => $totalCost,
                'purchased_at'      => $request->purchased_at,
                'notes'             => $request->notes,
                'expense_record_id' => $expense->id,
            ]);

            DB::commit();

            return $this->success($purchase->load('supply'), 'Compra registrada correctamente', 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('Error al registrar la compra financiera: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Revertir una compra (Elimina tanto del stock/historial como el billete en ExpenseRecord)
     */
    public function destroyPurchase($id)
    {
        $purchase = SupplyTransaction::findOrFail($id);
        $this->authorize('delete', $purchase->supply); // Protegemos basado en el insumo

        DB::beginTransaction();
        try {
            // Borrar registro financiero si existe aún
            if ($purchase->expense_record_id) {
                ExpenseRecord::where('id', $purchase->expense_record_id)->delete();
            }
            // Borrar movimiento de inventario
            $purchase->delete();

            DB::commit();
            return $this->success(null, 'Registro de compra y gasto revertidos con éxito');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->error('No se pudo deshacer la compra.', 500);
        }
    }
}
