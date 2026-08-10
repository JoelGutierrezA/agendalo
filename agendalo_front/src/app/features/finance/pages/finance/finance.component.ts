import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { BusinessService } from '../../../settings/services/business.service';
import { SupabaseService } from '../../../../core/services/supabase.service';

interface ExpenseCategory {
  id: number;
  name: string;
  is_active: boolean;
}

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyStateComponent],
  template: `
    <div>
      <div class="page-header">
        <div class="flex items-center gap-3">
          <img src="assets/Interfaz/Finanzas.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
          <h1 class="page-title">Finanzas</h1>
        </div>
        <div class="flex gap-2">
          <select class="form-input w-40" [(ngModel)]="period" (change)="loadData()">
            <option value="current">Este mes</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        @for (kpi of kpis; track kpi.label) {
          <div class="kpi-card relative overflow-hidden">
            <div class="kpi-icon" [style.background]="kpi.bg">
              <span class="text-xl">{{ kpi.icon }}</span>
            </div>
            <div class="flex-1">
              <p class="text-text-secondary text-xs uppercase tracking-wider">{{ kpi.label }}</p>
              @if (loadingKpis) {
                <div class="skeleton-title mt-1 h-8"></div>
              } @else {
                <p class="text-2xl font-bold mt-0.5 fade-in" [class]="kpi.textColor">{{ kpi.value | currency:'CLP':'$':'1.0-0' }}</p>
              }
            </div>
          </div>
        }
      </div>

      <div class="flex gap-1 mb-4 border-b border-border">
        @for (tab of tabs; track tab) {
          <button
            (click)="activeTab = tab; loadActiveTabData()"
            class="px-4 py-2.5 text-sm font-medium transition-colors"
            [class]="activeTab === tab ? 'text-primary border-b-2 border-primary bg-primary-light/30' : 'text-text-secondary hover:text-text-primary'"
          >{{ tab }}</button>
        }
      </div>

      <div class="card p-0 overflow-hidden">
        <div class="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-gray-50/50">
          <h3 class="font-bold text-text-primary text-lg">Historial de {{ activeTab }}</h3>

          <div class="flex gap-2">
            @if (activeTab === 'Egresos') {
              <button class="btn-secondary btn-sm" (click)="openCategoryModal()">Categorías</button>
            }
            <button class="btn-primary btn-sm" (click)="openTransactionModal()">
              + Registrar {{ activeTab === 'Ingresos' ? 'Ingreso' : 'Egreso' }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto min-h-[300px]">
          @if (loadingTable) {
            <div class="py-16 text-center text-text-secondary animate-pulse">Cargando movimientos...</div>
          } @else if (listData.length === 0) {
            <app-empty-state
              [icon]="activeTab === 'Ingresos' ? '💰' : '📉'"
              [title]="'No hay registros de ' + activeTab.toLowerCase()"
              [description]="'Registra tus movimientos para llevar un control detallado de tus finanzas.'"
              [actionLabel]="'Registrar ' + (activeTab === 'Ingresos' ? 'Ingreso' : 'Egreso')"
              (onAction)="openTransactionModal()"
            ></app-empty-state>
          } @else {
            <table class="w-full text-sm text-left">
              <thead class="bg-white border-b border-border text-text-secondary">
                <tr>
                  <th class="px-5 py-3 font-medium">Fecha</th>
                  <th class="px-5 py-3 font-medium">Descripción</th>
                  @if (activeTab === 'Egresos') {
                    <th class="px-5 py-3 font-medium">Categoría</th>
                  }
                  <th class="px-5 py-3 font-medium text-right">Monto</th>
                  <th class="px-5 py-3 font-medium text-right w-20">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border fade-in">
                @for (item of listData; track item.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-5 py-3 text-text-primary font-medium">{{ item.recorded_at | date:'dd MMM yyyy' }}</td>
                    <td class="px-5 py-3 text-text-secondary">
                      {{ item.description }}
                      @if(item.notes) {
                        <span class="text-xs text-gray-400 block truncate max-w-xs">{{ item.notes }}</span>
                      }
                    </td>
                    @if (activeTab === 'Egresos') {
                      <td class="px-5 py-3">
                        <span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200">
                          {{ item.category ? item.category.name : 'Gasto' }}
                        </span>
                      </td>
                    }
                    <td class="px-5 py-3 text-right font-bold" [ngClass]="activeTab === 'Ingresos' ? 'text-success' : 'text-danger'">
                      {{ activeTab === 'Ingresos' ? '+' : '-' }}{{ item.amount | currency:'CLP':'$':'1.0-0' }}
                    </td>
                    <td class="px-5 py-3 text-right">
                      <button class="text-text-secondary hover:text-red-500 transition-colors" (click)="deleteTransaction(item.id)">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>

      @if (showTxModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h3 class="text-lg font-bold text-text-primary">Registrar {{ activeTab.slice(0, -1) }}</h3>
              <button (click)="closeModals()" class="text-gray-400 hover:text-gray-600 text-xl font-bold p-2 leading-none">&times;</button>
            </div>

            <form [formGroup]="txForm" (ngSubmit)="saveTransaction()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Monto (CLP) *</label>
                  <input type="number" formControlName="amount" class="form-input text-lg font-bold" placeholder="0" />
                </div>
                <div>
                  <label class="form-label">Fecha *</label>
                  <input type="date" formControlName="recorded_at" class="form-input" />
                </div>
              </div>

              <div>
                <label class="form-label">Descripción breve *</label>
                <input type="text" formControlName="description" class="form-input" placeholder="Ej: Pago de cliente, insumos, etc." />
              </div>

              @if (activeTab === 'Egresos') {
                <div>
                  <label class="form-label">Categoría *</label>
                  <div class="flex gap-2">
                    <select formControlName="category_id" class="form-input flex-1">
                      <option value="">Seleccione...</option>
                      @for (cat of categories; track cat.id) {
                        <option [value]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                    <button type="button" class="btn-secondary px-3" (click)="openCategoryModal()" title="Gestionar categorías">+</button>
                  </div>
                </div>
              }

              <div>
                <label class="form-label">Notas adicionales</label>
                <textarea formControlName="notes" class="form-input" rows="2" placeholder="Detalles de factura, medio de pago..."></textarea>
              </div>

              <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" class="btn-secondary" (click)="closeModals()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="saving">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showCatModal) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 class="font-bold">Categorías de Egresos</h3>
              <button (click)="showCatModal = false" class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div class="p-6">
              <div class="flex gap-2 mb-6">
                <input type="text" [(ngModel)]="newCatName" class="form-input flex-1" placeholder="Nueva categoría..." />
                <button class="btn-primary" (click)="saveCategory()" [disabled]="!newCatName.trim() || saving">Añadir</button>
              </div>

              <div class="border border-border rounded-lg max-h-60 overflow-y-auto">
                <ul class="divide-y divide-border">
                  @for (cat of categories; track cat.id) {
                    <li class="flex justify-between items-center p-3 hover:bg-gray-50">
                      <span class="text-sm font-medium">{{ cat.name }}</span>
                      <button class="text-red-500 hover:text-red-700 text-sm" (click)="deleteCategory(cat.id)">Eliminar</button>
                    </li>
                  }
                  @if (categories.length === 0) {
                    <li class="p-4 text-center text-sm text-gray-500">Agrega tu primera categoría. Ej: Arriendo, Insumos.</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.2s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class FinanceComponent implements OnInit {
  tabs = ['Ingresos', 'Egresos'];
  activeTab = 'Ingresos';
  period = 'current';

  listData: any[] = [];
  categories: ExpenseCategory[] = [];

  kpis = [
    { id: 'income', label: 'Total ingresos', value: 0, icon: '💰', bg: '#F0FDF4', textColor: 'text-success' },
    { id: 'expense', label: 'Total egresos', value: 0, icon: '📉', bg: '#FEF2F2', textColor: 'text-danger' },
    { id: 'balance', label: 'Balance neto', value: 0, icon: '📊', bg: '#EFF6FF', textColor: 'text-primary' },
  ];

  loadingKpis = false;
  loadingTable = false;
  showTxModal = false;
  showCatModal = false;
  saving = false;

  txForm: FormGroup;
  newCatName = '';

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private supabase: SupabaseService
  ) {
    this.txForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      recorded_at: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required],
      category_id: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    void this.loadData();
    void this.loadCategories();
  }

  async loadData(): Promise<void> {
    await Promise.all([
      this.loadKpis(),
      this.loadActiveTabData(),
    ]);
  }

  async loadActiveTabData(): Promise<void> {
    this.loadingTable = true;
    const business = this.businessService.currentBusiness();
    if (!business) {
      this.loadingTable = false;
      return;
    }

    try {
      const table = this.activeTab === 'Ingresos' ? 'income_records' : 'expense_records';
      const select = this.activeTab === 'Ingresos' ? '*' : '*, category:expense_categories(*)';
      let query = this.supabase.client
        .from(table)
        .select(select)
        .eq('business_id', business.id)
        .order('recorded_at', { ascending: false })
        .order('id', { ascending: false });

      const period = this.getPeriodParams();
      if (period.start_date) query = query.gte('recorded_at', period.start_date);
      if (period.end_date) query = query.lte('recorded_at', period.end_date);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      this.listData = (data ?? []).map((row: any) => ({
        ...row,
        amount: Number(row.amount ?? 0),
        category: Array.isArray(row.category) ? row.category[0] : row.category,
      }));
    } catch (error: any) {
      alert(error?.message ?? 'No se pudieron cargar los movimientos.');
    } finally {
      this.loadingTable = false;
    }
  }

  async loadKpis(): Promise<void> {
    this.loadingKpis = true;
    const business = this.businessService.currentBusiness();
    if (!business) {
      this.loadingKpis = false;
      return;
    }

    try {
      const [income, expenses] = await Promise.all([
        this.sumTable('income_records', business.id),
        this.sumTable('expense_records', business.id),
      ]);

      this.kpis[0].value = income;
      this.kpis[1].value = expenses;
      this.kpis[2].value = income - expenses;
    } finally {
      this.loadingKpis = false;
    }
  }

  getPeriodParams(): { start_date?: string; end_date?: string } {
    if (this.period === 'all') return {};
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start_date: firstDay, end_date: lastDay };
  }

  openTransactionModal(): void {
    this.txForm.reset({ recorded_at: new Date().toISOString().split('T')[0] });

    if (this.activeTab === 'Egresos') {
      this.txForm.get('category_id')?.setValidators(Validators.required);
    } else {
      this.txForm.get('category_id')?.clearValidators();
    }
    this.txForm.get('category_id')?.updateValueAndValidity();

    this.showTxModal = true;
  }

  closeModals(): void {
    this.showTxModal = false;
    this.showCatModal = false;
  }

  async saveTransaction(): Promise<void> {
    if (this.txForm.invalid) {
      this.txForm.markAllAsTouched();
      return;
    }

    const business = this.businessService.currentBusiness();
    if (!business) return;

    this.saving = true;
    try {
      const table = this.activeTab === 'Ingresos' ? 'income_records' : 'expense_records';
      const payload: any = {
        business_id: business.id,
        description: this.txForm.value.description,
        amount: Number(this.txForm.value.amount),
        recorded_at: this.txForm.value.recorded_at,
        notes: this.txForm.value.notes || null,
      };

      if (this.activeTab === 'Egresos') {
        payload.category_id = Number(this.txForm.value.category_id);
      }

      const { error } = await this.supabase.client.from(table).insert(payload);
      if (error) throw new Error(error.message);

      this.closeModals();
      await this.loadData();
    } catch (error: any) {
      alert(error?.message ?? 'Revisa los campos.');
    } finally {
      this.saving = false;
    }
  }

  async deleteTransaction(id: number): Promise<void> {
    if (!confirm('¿Eliminar este registro de forma permanente?')) return;

    const business = this.businessService.currentBusiness();
    if (!business) return;

    const table = this.activeTab === 'Ingresos' ? 'income_records' : 'expense_records';
    const { error } = await this.supabase.client
      .from(table)
      .delete()
      .eq('id', id)
      .eq('business_id', business.id);

    if (error) {
      alert(error.message);
      return;
    }

    await this.loadData();
  }

  async loadCategories(): Promise<void> {
    const business = this.businessService.currentBusiness();
    if (!business) return;

    const { data, error } = await this.supabase.client
      .from('expense_categories')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      alert(error.message);
      return;
    }

    this.categories = data ?? [];
  }

  openCategoryModal(): void {
    this.showCatModal = true;
  }

  async saveCategory(): Promise<void> {
    const business = this.businessService.currentBusiness();
    if (!business || !this.newCatName.trim()) return;

    this.saving = true;
    const { error } = await this.supabase.client
      .from('expense_categories')
      .insert({
        business_id: business.id,
        name: this.newCatName.trim(),
        is_active: true,
      });

    this.saving = false;
    if (error) {
      alert(error.message);
      return;
    }

    this.newCatName = '';
    await this.loadCategories();
  }

  async deleteCategory(id: number): Promise<void> {
    if (!confirm('¿Eliminar esta categoría? Esto no eliminará los gastos asignados previamente.')) return;

    const business = this.businessService.currentBusiness();
    if (!business) return;

    const { error } = await this.supabase.client
      .from('expense_categories')
      .delete()
      .eq('id', id)
      .eq('business_id', business.id);

    if (error) {
      alert(error.message);
      return;
    }

    await this.loadCategories();
  }

  private async sumTable(table: 'income_records' | 'expense_records', businessId: number): Promise<number> {
    let query = this.supabase.client
      .from(table)
      .select('amount')
      .eq('business_id', businessId);

    const period = this.getPeriodParams();
    if (period.start_date) query = query.gte('recorded_at', period.start_date);
    if (period.end_date) query = query.lte('recorded_at', period.end_date);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
  }
}
