import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { NgApexchartsModule, ApexAxisChartSeries, ApexChart, ApexXAxis, ApexDataLabels, ApexTooltip, ApexStroke, ApexYAxis, ApexFill, ApexGrid } from "ng-apexcharts";
import { DashboardService, DashboardSummary } from '../../../../core/services/dashboard.service';
import { BusinessService } from '../../../settings/services/business.service';
import { SupabaseService } from '../../../../core/services/supabase.service';

interface ExpenseCategory {
  id: number;
  name: string;
  is_active: boolean;
}

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  fill: ApexFill;
  yaxis: ApexYAxis;
  grid: ApexGrid;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NgApexchartsModule],
  template: `
    <div class="space-y-6 fade-in">
      <!-- Page Header -->
      <div class="page-header flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="sm:hidden grid grid-cols-2 gap-2">
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary/40 hover:text-primary"
            (click)="copyBookingLink()"
          >
            {{ copyLinkLabel }}
          </button>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary/40 hover:text-primary"
            (click)="openQrModal()"
          >
            Generar QR
          </button>
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <img src="assets/Interfaz/Dashboard.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
            <h1 class="page-title">Finanzas</h1>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button type="button" class="btn-secondary min-h-11 justify-center px-3 text-xs leading-tight sm:text-sm" (click)="openTransactionModal('Ingresos')">
            + Registrar ingreso
          </button>
          <button type="button" class="btn-primary min-h-11 justify-center px-3 text-xs leading-tight sm:text-sm" (click)="openTransactionModal('Egresos')">
            + Registrar egreso
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        @for (kpi of kpis; track kpi.label) {
          <div class="card p-4 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-text-secondary text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{{ kpi.label }}</p>
                @if (loading) {
                  <div class="skeleton-text w-16 sm:w-24 h-7 sm:h-8 mt-1"></div>
                } @else {
                  <p class="text-xl sm:text-2xl font-bold text-text-primary">{{ kpi.value }}</p>
                }
              </div>
              <div class="hidden sm:flex flex-shrink-0 w-14 h-14 rounded-xl items-center justify-center overflow-hidden transition-transform group-hover:scale-110" [style.background]="kpi.iconBg">
                <img [src]="kpi.iconPath" alt="" class="w-14 h-14 object-cover" aria-hidden="true">
              </div>
            </div>
            <!-- Subtitle/Trend -->
            <div class="mt-3 sm:mt-4 flex items-center gap-1">
               <span class="text-xs font-medium" [class]="kpi.trendColor">{{ kpi.trend }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Gráfico Principal -->
        <div class="card lg:col-span-2 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg text-text-primary">Evolución Semanal</h3>
            <div class="flex gap-4">
              <span class="flex items-center gap-1.5 text-xs text-text-secondary">
                <span class="w-2 h-2 rounded-full bg-primary"></span> Citas
              </span>
              <span class="flex items-center gap-1.5 text-xs text-text-secondary">
                <span class="w-2 h-2 rounded-full bg-green-500"></span> Ingresos
              </span>
            </div>
          </div>
          
          @if (loading) {
            <div class="h-64 flex items-center justify-center bg-background rounded-lg">
              <span class="text-text-secondary text-sm">Cargando gráfico...</span>
            </div>
          } @else {
            <div id="chart" class="h-64">
              <apx-chart
                [series]="chartOptions.series!"
                [chart]="chartOptions.chart!"
                [xaxis]="chartOptions.xaxis!"
                [stroke]="chartOptions.stroke!"
                [dataLabels]="chartOptions.dataLabels!"
                [tooltip]="chartOptions.tooltip!"
                [fill]="chartOptions.fill!"
                [yaxis]="chartOptions.yaxis!"
                [grid]="chartOptions.grid!"
              ></apx-chart>
            </div>
          }
        </div>

        <!-- Próximas Citas -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg text-text-primary">Próximas Citas</h3>
            <a routerLink="/app/agenda" class="text-xs text-primary font-medium hover:underline">Ver todas</a>
          </div>

          @if (loading) {
            <div class="space-y-4">
              @for (i of [1,2,3,4]; track i) {
                <div class="flex items-center gap-3">
                  <div class="skeleton w-10 h-10 rounded-lg"></div>
                  <div class="flex-1 space-y-2">
                    <div class="skeleton w-3/4 h-3"></div>
                    <div class="skeleton w-1/2 h-2"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (upcomingAppointments.length === 0) {
            <div class="py-8 text-center bg-background/50 rounded-lg border border-border border-dashed">
               <img src="assets/Interfaz/Citas.png" alt="" class="w-10 h-10 rounded-lg object-cover mx-auto mb-2 opacity-70" aria-hidden="true">
               <p class="text-text-secondary text-sm">No hay citas próximas</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (apt of upcomingAppointments; track apt.id) {
                <div class="flex items-center justify-between group">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-50 border border-border flex flex-col items-center justify-center text-[10px] font-bold text-text-secondary group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                      <span>{{ apt.time }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-text-primary truncate max-w-[120px]">{{ apt.client_name }}</p>
                      <p class="text-[11px] text-text-secondary">{{ apt.service_name }}</p>
                    </div>
                  </div>
                  <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    [ngClass]="{
                      'bg-blue-50 text-blue-700': apt.status === 'confirmed',
                      'bg-yellow-50 text-yellow-700': apt.status === 'pending'
                    }">
                    {{ apt.status === 'confirmed' ? 'Conf' : 'Pend' }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      @if (showTxModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h3 class="text-lg font-bold text-text-primary">Registrar {{ activeFinanceType.slice(0, -1) }}</h3>
              <button type="button" (click)="closeModals()" class="text-gray-400 hover:text-gray-600 text-xl font-bold p-2 leading-none">&times;</button>
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
                <label class="form-label">Descripcion breve *</label>
                <input type="text" formControlName="description" class="form-input" placeholder="Ej: Pago de cliente, insumos, etc." />
              </div>

              @if (activeFinanceType === 'Egresos') {
                <div>
                  <label class="form-label">Categoria *</label>
                  <div class="flex gap-2">
                    <select formControlName="category_id" class="form-input flex-1">
                      <option value="">Seleccione...</option>
                      @for (cat of categories; track cat.id) {
                        <option [value]="cat.id">{{ cat.name }}</option>
                      }
                    </select>
                    <button type="button" class="btn-secondary px-3" (click)="openCategoryModal()" title="Gestionar categorias">+</button>
                  </div>
                </div>
              }

              <div>
                <label class="form-label">Notas adicionales</label>
                <textarea formControlName="notes" class="form-input" rows="2" placeholder="Detalles de factura, medio de pago..."></textarea>
              </div>

              <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" class="btn-secondary" (click)="closeModals()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="saving">
                  {{ saving ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showCatModal) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 class="font-bold">Categorias de Egresos</h3>
              <button type="button" (click)="showCatModal = false" class="text-gray-400 hover:text-gray-600">&times;</button>
            </div>

            <div class="p-6">
              <div class="flex gap-2 mb-6">
                <input type="text" [(ngModel)]="newCatName" class="form-input flex-1" placeholder="Nueva categoria..." />
                <button type="button" class="btn-primary" (click)="saveCategory()" [disabled]="!newCatName.trim() || saving">Anadir</button>
              </div>

              <div class="border border-border rounded-lg max-h-60 overflow-y-auto">
                <ul class="divide-y divide-border">
                  @for (cat of categories; track cat.id) {
                    <li class="flex justify-between items-center p-3 hover:bg-gray-50">
                      <span class="text-sm font-medium">{{ cat.name }}</span>
                      <button type="button" class="text-red-500 hover:text-red-700 text-sm" (click)="deleteCategory(cat.id)">Eliminar</button>
                    </li>
                  }
                  @if (categories.length === 0) {
                    <li class="p-4 text-center text-sm text-gray-500">Agrega tu primera categoria. Ej: Arriendo, Insumos.</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </div>
      }

      @if (showQrModal) {
        <div class="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <button
            type="button"
            class="absolute inset-0"
            aria-label="Cerrar QR"
            (click)="closeQrModal()"
          ></button>

          <div class="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-in-up">
            <div class="flex items-center justify-between gap-4 mb-5">
              <h2 class="text-lg font-bold text-text-primary">QR para tomar citas</h2>
              <button
                type="button"
                class="w-9 h-9 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-gray-50"
                aria-label="Cerrar QR"
                (click)="closeQrModal()"
              >
                &times;
              </button>
            </div>

            <div class="mx-auto relative w-72 h-72 max-w-full rounded-2xl border border-border bg-white p-4">
              <img [src]="qrImageUrl()" alt="QR para tomar citas" class="w-full h-full object-contain">
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-16 h-16 rounded-2xl bg-white shadow-lg border border-border flex items-center justify-center p-2">
                  <img src="assets/Icono%20Skedia%201.png" alt="Skedia" class="w-full h-full object-contain rounded-xl">
                </div>
              </div>
            </div>

            <p class="mt-4 text-sm text-text-secondary break-all">{{ publicBookingUrl() }}</p>
            <button type="button" class="btn-primary w-full justify-center mt-5" (click)="copyBookingLink()">
              {{ copyLinkLabel }}
            </button>
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
export class DashboardComponent implements OnInit {
  loading = true;
  upcomingAppointments: any[] = [];
  activeFinanceType: 'Ingresos' | 'Egresos' = 'Ingresos';
  categories: ExpenseCategory[] = [];
  showTxModal = false;
  showCatModal = false;
  showQrModal = false;
  saving = false;
  newCatName = '';
  copyLinkLabel = 'Copiar enlace';
  txForm: FormGroup;

  kpis: any[] = [
    { label: 'Citas Hoy', value: '0', iconPath: 'assets/Interfaz/Citas.png', iconBg: '#EFF6FF', trend: 'Hoy', trendColor: 'text-text-secondary' },
    { label: 'Ingresos (Mes)', value: '$0', iconPath: 'assets/Interfaz/Finanzas.png', iconBg: '#F0FDF4', trend: 'Actual', trendColor: 'text-success' },
    { label: 'Egresos (Mes)', value: '$0', iconPath: 'assets/Interfaz/Finanzas.png', iconBg: '#FEF2F2', trend: 'Actual', trendColor: 'text-danger' },
    { label: 'Balance', value: '$0', iconPath: 'assets/Interfaz/Dashboard.png', iconBg: '#F8FAFC', trend: 'Mensual', trendColor: 'text-text-secondary' },
  ];

  public chartOptions: Partial<ChartOptions> = {};

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private businessService: BusinessService,
    private supabase: SupabaseService,
    public router: Router
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
    this.initChart();
    this.loadData();
    void this.loadCategories();
  }

  async copyBookingLink(): Promise<void> {
    const url = this.publicBookingUrl();
    if (!url) {
      this.temporarilySetCopyLabel('Sin enlace disponible');
      return;
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else if (!this.copyWithFallback(url)) {
        throw new Error('Clipboard unavailable');
      }

      this.temporarilySetCopyLabel('Enlace copiado');
    } catch {
      this.temporarilySetCopyLabel('No se pudo copiar');
    }
  }

  openQrModal(): void {
    if (!this.publicBookingUrl()) {
      this.temporarilySetCopyLabel('Sin enlace disponible');
      return;
    }

    this.showQrModal = true;
  }

  closeQrModal(): void {
    this.showQrModal = false;
  }

  qrImageUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=18&data=${encodeURIComponent(this.publicBookingUrl())}`;
  }

  publicBookingUrl(): string {
    const slug = this.businessService.currentBusiness()?.slug;
    if (!slug || typeof window === 'undefined') return '';
    return `${window.location.origin}/negocio/${slug}`;
  }

  private copyWithFallback(text: string): boolean {
    if (typeof document === 'undefined') return false;

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  }

  private temporarilySetCopyLabel(label: string): void {
    this.copyLinkLabel = label;
    setTimeout(() => {
      this.copyLinkLabel = 'Copiar enlace';
    }, 1800);
  }

  private initChart(): void {
    this.chartOptions = {
      series: [
        { name: "Citas", data: [] },
        { name: "Ingresos", data: [] }
      ],
      chart: {
        height: 260,
        type: "area",
        toolbar: { show: false },
        fontFamily: 'Inter, sans-serif'
      },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 2 },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100, 100, 100]
        }
      },
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: [
        { title: { text: "Citas" } },
        { opposite: true, title: { text: "Ingresos ($)" } }
      ] as any,
      grid: {
        borderColor: "#f1f1f1",
        strokeDashArray: 4,
        padding: { left: 0, right: 0 }
      },
      tooltip: { x: { format: "dd/MM/yy" } }
    };
  }

  private loadData(): void {
    this.dashboardService.getSummary().subscribe({
      next: (data: DashboardSummary) => {
        // Actualizar KPIs
        const fmt = new Intl.NumberFormat('es-CL');
        this.kpis[0].value = data.kpis.today_appointments.toString();
        this.kpis[1].value = `$${fmt.format(data.kpis.monthly_income)}`;
        this.kpis[2].value = `$${fmt.format(data.kpis.monthly_expenses)}`;
        this.kpis[3].value = `$${fmt.format(data.kpis.monthly_balance)}`;
        this.kpis[3].trendColor = data.kpis.monthly_balance >= 0 ? 'text-success' : 'text-danger';

        this.upcomingAppointments = data.upcoming_appointments;

        // Actualizar Gráfico
        this.chartOptions.series = [
          { name: "Citas", data: data.chart_data.appointments },
          { name: "Ingresos", data: data.chart_data.income }
        ];
        this.chartOptions.xaxis = {
          categories: data.chart_data.labels,
          axisBorder: { show: false },
          axisTicks: { show: false }
        };
        
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  openTransactionModal(type: 'Ingresos' | 'Egresos'): void {
    this.activeFinanceType = type;
    this.txForm.reset({ recorded_at: new Date().toISOString().split('T')[0] });

    if (type === 'Egresos') {
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
      const table = this.activeFinanceType === 'Ingresos' ? 'income_records' : 'expense_records';
      const payload: any = {
        business_id: business.id,
        description: this.txForm.value.description,
        amount: Number(this.txForm.value.amount),
        recorded_at: this.txForm.value.recorded_at,
        notes: this.txForm.value.notes || null,
      };

      if (this.activeFinanceType === 'Egresos') {
        payload.category_id = Number(this.txForm.value.category_id);
      }

      const { error } = await this.supabase.client.from(table).insert(payload);
      if (error) throw new Error(error.message);

      this.closeModals();
      this.loadData();
    } catch (error: any) {
      alert(error?.message ?? 'Revisa los campos.');
    } finally {
      this.saving = false;
    }
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
    if (!confirm('Eliminar esta categoria? Esto no eliminara los gastos asignados previamente.')) return;

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
}

