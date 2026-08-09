import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

interface Income {
  id: number; description: string; amount: string; recorded_at: string; notes: string | null;
}
interface Expense {
  id: number; category_id: number; description: string; amount: string; recorded_at: string;
  category?: ExpenseCategory;
}
interface ExpenseCategory {
  id: number; name: string; is_active: boolean;
}

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmptyStateComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Finanzas</h1>
        <div class="flex gap-2">
          <select class="form-input w-40" [(ngModel)]="period" (change)="loadData()">
            <option value="current">Este mes</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
      </div>

      <!-- KPIs Financieros -->
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

      <!-- Tabs -->
      <div class="flex gap-1 mb-4 border-b border-border">
        @for (tab of tabs; track tab) {
          <button
            (click)="activeTab = tab; loadActiveTabData()"
            class="px-4 py-2.5 text-sm font-medium transition-colors"
            [class]="activeTab === tab ? 'text-primary border-b-2 border-primary bg-primary-light/30' : 'text-text-secondary hover:text-text-primary'"
          >{{ tab }}</button>
        }
      </div>

      <!-- Contenido de Transacciones -->
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
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-white border-b border-border">
                  <tr>
                    <th class="px-5 py-3 h-10 w-32"><div class="skeleton h-4 w-20"></div></th>
                    <th class="px-5 py-3 h-10"><div class="skeleton h-4 w-48"></div></th>
                    @if (activeTab === 'Egresos') { <th class="px-5 py-3 h-10 w-32"><div class="skeleton h-4 w-24"></div></th> }
                    <th class="px-5 py-3 h-10 text-right"><div class="skeleton h-4 w-16 ml-auto"></div></th>
                    <th class="px-5 py-3 h-10 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (i of [1,2,3,4]; track i) {
                    <tr>
                      <td class="px-5 py-4"><div class="skeleton-text w-24"></div></td>
                      <td class="px-5 py-4"><div class="skeleton-text w-48"></div><div class="skeleton-text w-32 h-3 mt-2"></div></td>
                      @if (activeTab === 'Egresos') { <td class="px-5 py-4"><div class="skeleton w-20 h-6 rounded-full"></div></td> }
                      <td class="px-5 py-4 text-right"><div class="skeleton-text w-20 ml-auto"></div></td>
                      <td class="px-5 py-4 text-right"><div class="skeleton-circle w-6 h-6 ml-auto"></div></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
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
                  @if (activeTab === 'Egresos') { <th class="px-5 py-3 font-medium">Categoría</th> }
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
                      @if(item.notes) { <span class="text-xs text-gray-400 block truncate max-w-xs">{{item.notes}}</span> }
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
                        🗑️
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
      
      <!-- MODAL TRANSACCION -->
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
                <input type="text" formControlName="description" class="form-input" placeholder="Ej: Pago de cliente, Insumos, etc." />
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
                    <button type="button" class="btn-secondary px-3" (click)="openCategoryModal()" title="Gestionar categorías">⚙️</button>
                  </div>
                </div>
              }

              <div>
                <label class="form-label">Notas adicionales (Opcional)</label>
                <textarea formControlName="notes" class="form-input" rows="2" placeholder="Detalles de la factura, medio de pago..."></textarea>
              </div>

              <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" class="btn-secondary" (click)="closeModals()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="saving">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL CATEGORIAS -->
      @if (showCatModal) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 class="font-bold">Categorías de Egresos</h3>
              <button (click)="showCatModal = false" class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            
            <div class="p-6">
              <!-- Crear nueva -->
              <div class="flex gap-2 mb-6">
                <input type="text" [(ngModel)]="newCatName" class="form-input flex-1" placeholder="Nueva categoría..." />
                <button class="btn-primary" (click)="saveCategory()" [disabled]="!newCatName.trim() || saving">Añadir</button>
              </div>

              <!-- Lista -->
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
  
  // KPIs
  kpis = [
    { id: 'income', label: 'Total ingresos', value: 0, icon: '💰', bg: '#F0FDF4', textColor: 'text-success' },
    { id: 'expense', label: 'Total egresos', value: 0, icon: '📉', bg: '#FEF2F2', textColor: 'text-danger' },
    { id: 'balance', label: 'Balance Neto', value: 0, icon: '📊', bg: '#EFF6FF', textColor: 'text-primary' },
  ];

  // State
  loadingKpis = false;
  loadingTable = false;
  showTxModal = false;
  showCatModal = false;
  saving = false;

  // Forms
  txForm: FormGroup;
  newCatName = '';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.txForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      recorded_at: [new Date().toISOString().split('T')[0], Validators.required],
      description: ['', Validators.required],
      category_id: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadCategories();
  }

  // Carga Maestra
  loadData() {
    this.loadKpis();
    this.loadActiveTabData();
  }

  loadActiveTabData() {
    this.loadingTable = true;
    const endpoint = this.activeTab === 'Ingresos' ? 'income' : 'expenses';
    const params = this.getPeriodParams();
    
    this.http.get<any>(`${environment.apiUrl}/finance/${endpoint}`, { params: params as any }).subscribe({
      next: (res: any) => {
        this.listData = res.data.data;
        this.loadingTable = false;
      },
      error: () => this.loadingTable = false
    });
  }

  // Dashboard de KPIs en backend (Reutilizado del DashboardController o simulado sumando)
  loadKpis() {
    this.loadingKpis = true;
    const params = this.getPeriodParams();
    
    // Obtenemos del summary global del Dashboard
    this.http.get<any>(`${environment.apiUrl}/dashboard/summary`, { params: params as any }).subscribe({
      next: (res) => {
         const data = res.data;
         const income = data?.kpis?.monthly_income ?? data?.total_revenue ?? 0;
         const expenses = data?.kpis?.monthly_expenses ?? data?.total_expenses ?? 0;

         this.kpis[0].value = income;
         this.kpis[1].value = expenses;
         this.kpis[2].value = income - expenses;
         this.loadingKpis = false;
      },
      error: () => this.loadingKpis = false
    });
  }

  getPeriodParams() {
    if (this.period === 'all') return {};
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
    return { start_date: firstDay, end_date: lastDay } as any;
  }

  // --- TRANSACCIONES ---
  openTransactionModal() {
    this.txForm.reset({ recorded_at: new Date().toISOString().split('T')[0] });
    
    // Validadores dinámicos según el tab
    if (this.activeTab === 'Egresos') {
      this.txForm.get('category_id')?.setValidators(Validators.required);
    } else {
      this.txForm.get('category_id')?.clearValidators();
    }
    this.txForm.get('category_id')?.updateValueAndValidity();
    
    this.showTxModal = true;
  }

  closeModals() {
    this.showTxModal = false;
    this.showCatModal = false;
  }

  saveTransaction() {
    if (this.txForm.invalid) {
      this.txForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const endpoint = this.activeTab === 'Ingresos' ? 'income' : 'expenses';
    
    this.http.post(`${environment.apiUrl}/finance/${endpoint}`, this.txForm.value).subscribe({
      next: () => {
        this.saving = false;
        this.closeModals();
        this.loadData(); // Refrescar tabla y KPIs
      },
      error: (err) => {
        alert('Error: ' + (err.error?.message || 'Revisa los campos'));
        this.saving = false;
      }
    });
  }

  deleteTransaction(id: number) {
    if (confirm('¿Eliminar este registro de forma permanente?')) {
      const endpoint = this.activeTab === 'Ingresos' ? 'income' : 'expenses';
      this.http.delete(`${environment.apiUrl}/finance/${endpoint}/${id}`).subscribe(() => this.loadData());
    }
  }

  // --- CATEGORIAS DE EGRESO ---
  loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/finance/expense-categories`).subscribe(res => {
      this.categories = res.data;
    });
  }

  openCategoryModal() {
    this.showCatModal = true;
  }

  saveCategory() {
    this.saving = true;
    this.http.post(`${environment.apiUrl}/finance/expense-categories`, { name: this.newCatName.trim() }).subscribe({
      next: () => {
        this.saving = false;
        this.newCatName = '';
        this.loadCategories(); // Refrescar
      },
      error: () => this.saving = false
    });
  }

  deleteCategory(id: number) {
    if (confirm('¿Eliminar esta categoría? Esto no eliminará los gastos asignados a ella previamente.')) {
      this.http.delete(`${environment.apiUrl}/finance/expense-categories/${id}`).subscribe(() => this.loadCategories());
    }
  }
}
