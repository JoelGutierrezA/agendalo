import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { BusinessService } from '../../settings/services/business.service';
import { SupabaseService } from '../../../core/services/supabase.service';

export interface Supply {
  id: number;
  business_id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
}

export interface SupplyTransaction {
  id: number;
  business_id: number;
  supply_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchased_at: string;
  notes?: string | null;
  expense_record_id?: number | null;
  supply?: Supply | null;
}

@Injectable({
  providedIn: 'root'
})
export class SupplyService {
  constructor(
    private businessService: BusinessService,
    private supabase: SupabaseService
  ) {}

  getCatalog(): Observable<{ data: Supply[] }> {
    return defer(async () => {
      const business = this.requireBusiness();
      const { data, error } = await this.supabase.client
        .from('supplies')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw new Error(error.message);
      return { data: data ?? [] };
    });
  }

  createSupply(data: { name: string; description?: string }): Observable<{ data: Supply }> {
    return defer(async () => {
      const business = this.requireBusiness();
      const name = data.name.trim();

      const { data: existing, error: existingError } = await this.supabase.client
        .from('supplies')
        .select('id')
        .eq('business_id', business.id)
        .eq('name', name)
        .maybeSingle();

      if (existingError) throw new Error(existingError.message);
      if (existing) throw new Error('Este insumo ya existe en el catalogo.');

      const { data: supply, error } = await this.supabase.client
        .from('supplies')
        .insert({
          business_id: business.id,
          name,
          description: data.description || null,
          is_active: true,
        })
        .select('*')
        .single();

      if (error || !supply) throw new Error(error?.message ?? 'No se pudo crear el insumo.');
      return { data: supply };
    });
  }

  getPurchases(): Observable<{ data: { data: SupplyTransaction[] } }> {
    return defer(async () => {
      const business = this.requireBusiness();
      const { data, error } = await this.supabase.client
        .from('supply_transactions')
        .select(`
          *,
          supply:supplies(*)
        `)
        .eq('business_id', business.id)
        .order('purchased_at', { ascending: false })
        .order('id', { ascending: false });

      if (error) throw new Error(error.message);

      return {
        data: {
          data: (data ?? []).map((row: any) => ({
            ...row,
            supply: Array.isArray(row.supply) ? row.supply[0] : row.supply,
          })),
        },
      };
    });
  }

  registerPurchase(payload: {
    supply_id: number;
    quantity: number;
    unit_cost: number;
    purchased_at: string;
    notes?: string | null;
  }): Observable<{ data: SupplyTransaction }> {
    return defer(async () => {
      const business = this.requireBusiness();
      const supplyId = Number(payload.supply_id);
      const quantity = Number(payload.quantity);
      const unitCost = Number(payload.unit_cost);
      const totalCost = quantity * unitCost;

      const { data: supply, error: supplyError } = await this.supabase.client
        .from('supplies')
        .select('*')
        .eq('id', supplyId)
        .eq('business_id', business.id)
        .single();

      if (supplyError || !supply) throw new Error(supplyError?.message ?? 'Insumo no encontrado.');

      const category = await this.ensureSupplyExpenseCategory(business.id);
      const { data: expense, error: expenseError } = await this.supabase.client
        .from('expense_records')
        .insert({
          business_id: business.id,
          category_id: category.id,
          description: `Compra de Insumo: ${supply.name} (Cant: ${quantity})`,
          amount: totalCost,
          recorded_at: payload.purchased_at,
          notes: `Generado automáticamente desde Insumos. ${payload.notes ?? ''}`.trim(),
        })
        .select('id')
        .single();

      if (expenseError || !expense) throw new Error(expenseError?.message ?? 'No se pudo registrar el egreso.');

      const { data: purchase, error } = await this.supabase.client
        .from('supply_transactions')
        .insert({
          business_id: business.id,
          supply_id: supplyId,
          quantity,
          unit_cost: unitCost,
          total_cost: totalCost,
          purchased_at: payload.purchased_at,
          notes: payload.notes || null,
          expense_record_id: expense.id,
        })
        .select(`
          *,
          supply:supplies(*)
        `)
        .single();

      if (error || !purchase) throw new Error(error?.message ?? 'No se pudo registrar la compra.');

      return {
        data: {
          ...purchase,
          supply: Array.isArray((purchase as any).supply) ? (purchase as any).supply[0] : (purchase as any).supply,
        },
      };
    });
  }

  deletePurchase(id: number): Observable<{ data: null }> {
    return defer(async () => {
      const business = this.requireBusiness();
      const { data: purchase, error: purchaseError } = await this.supabase.client
        .from('supply_transactions')
        .select('expense_record_id')
        .eq('id', id)
        .eq('business_id', business.id)
        .single();

      if (purchaseError || !purchase) throw new Error(purchaseError?.message ?? 'Compra no encontrada.');

      if (purchase.expense_record_id) {
        const { error: expenseError } = await this.supabase.client
          .from('expense_records')
          .delete()
          .eq('id', purchase.expense_record_id)
          .eq('business_id', business.id);

        if (expenseError) throw new Error(expenseError.message);
      }

      const { error } = await this.supabase.client
        .from('supply_transactions')
        .delete()
        .eq('id', id)
        .eq('business_id', business.id);

      if (error) throw new Error(error.message);
      return { data: null };
    });
  }

  private async ensureSupplyExpenseCategory(businessId: number): Promise<{ id: number }> {
    const name = 'Compra de Insumos';
    const { data: existing, error: existingError } = await this.supabase.client
      .from('expense_categories')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', name)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) return existing;

    const { data, error } = await this.supabase.client
      .from('expense_categories')
      .insert({
        business_id: businessId,
        name,
        is_active: true,
      })
      .select('id')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la categoría de insumos.');
    return data;
  }

  private requireBusiness() {
    const business = this.businessService.currentBusiness();
    if (!business) throw new Error('No hay un negocio seleccionado.');
    return business;
  }
}
