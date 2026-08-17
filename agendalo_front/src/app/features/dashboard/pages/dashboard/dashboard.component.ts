import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DashboardService, DashboardSummary } from '../../../../core/services/dashboard.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BusinessService } from '../../../settings/services/business.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { AppointmentFilters, AppointmentRow, AppointmentsService } from '../../../appointments/services/appointments.service';

interface ExpenseCategory {
  id: number;
  name: string;
  is_active: boolean;
}

interface ServiceOption {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
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
            <h1 class="page-title">Dashboard</h1>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[minmax(260px,360px)_1fr] gap-6">
        <!-- KPI Cards -->
        <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1">
          @for (kpi of kpis; track kpi.label) {
          <div class="card p-3 sm:p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-text-secondary text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">{{ kpi.label }}</p>
                @if (loading) {
                  <div class="skeleton-text w-16 sm:w-24 h-7 sm:h-8 mt-1"></div>
                } @else {
                  <p class="text-lg sm:text-2xl font-bold text-text-primary">{{ kpi.value }}</p>
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

        <!-- Próximas Citas -->
        <div class="space-y-4 min-w-0">
        <div class="card p-4">
          <button
            type="button"
            class="xl:hidden w-full flex items-center justify-between text-left"
            (click)="toggleAppointmentFilters()"
            [attr.aria-expanded]="appointmentFiltersExpanded"
          >
            <span class="font-semibold text-text-primary">Filtros</span>
            <span class="text-sm text-primary font-semibold">{{ appointmentFiltersExpanded ? 'Ocultar' : 'Mostrar' }}</span>
          </button>

          <form
            class="grid-cols-1 gap-3 xl:grid xl:grid-cols-[minmax(220px,1fr)_160px_160px_220px_auto] xl:items-end"
            [ngClass]="appointmentFiltersExpanded ? 'grid mt-4 xl:mt-0' : 'hidden xl:grid'"
            (ngSubmit)="applyAppointmentFilters()"
          >
            <div>
              <label class="text-xs text-text-secondary font-medium mb-1 block">Buscar</label>
              <input
                type="text"
                name="dashboardAppointmentSearch"
                [(ngModel)]="appointmentFilters.search"
                class="form-input w-full"
                placeholder="Nombre, email o teléfono..."
              />
            </div>
            <div>
              <label class="text-xs text-text-secondary font-medium mb-1 block">Estado</label>
              <select
                name="dashboardAppointmentStatus"
                [(ngModel)]="appointmentFilters.status"
                (change)="loadAppointments()"
                class="form-input w-full"
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
                <option value="no_show">No asistió</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-text-secondary font-medium mb-1 block">Fecha</label>
              <input
                type="date"
                name="dashboardAppointmentDate"
                [(ngModel)]="appointmentFilters.date"
                (change)="loadAppointments()"
                class="form-input w-full"
              />
            </div>
            <div>
              <label class="text-xs text-text-secondary font-medium mb-1 block">Ordenar por</label>
              <select
                name="dashboardAppointmentSort"
                [(ngModel)]="appointmentFilters.sort_by"
                (change)="loadAppointments()"
                class="form-input w-full"
              >
                <option value="scheduled_at">Fecha de la cita</option>
                <option value="created_at">Fecha de creación</option>
              </select>
            </div>
            <button type="submit" class="btn-secondary h-[42px] justify-center px-6">Filtrar</button>
          </form>
        </div>

        <div class="card p-6 min-h-full">
          <div class="flex items-center justify-between mb-6">
            <h3 class="font-bold text-lg text-text-primary">Citas</h3>
            <a routerLink="/app/agenda" class="text-xs text-primary font-medium hover:underline">Ver todas</a>
          </div>

          @if (appointmentsLoading) {
            <div class="space-y-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="grid grid-cols-7 gap-3">
                  <div class="skeleton h-4 rounded col-span-1"></div>
                  <div class="skeleton h-4 rounded col-span-1"></div>
                  <div class="skeleton h-4 rounded col-span-1"></div>
                  <div class="skeleton h-4 rounded col-span-1"></div>
                  <div class="skeleton h-4 rounded col-span-1"></div>
                  <div class="skeleton h-4 rounded col-span-1"></div>
                  <div class="skeleton h-4 rounded col-span-1"></div>
                </div>
              }
            </div>
          } @else if (upcomingAppointments.length === 0) {
            <div class="py-8 text-center bg-background/50 rounded-lg border border-border border-dashed">
               <img src="assets/Interfaz/Citas.png" alt="" class="w-10 h-10 rounded-lg object-cover mx-auto mb-2 opacity-70" aria-hidden="true">
               <p class="text-text-secondary text-sm">No hay citas</p>
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="w-full min-w-[760px] text-left text-sm">
                <thead class="border-b border-border bg-gray-50/70 text-xs font-bold uppercase tracking-wider text-text-secondary">
                  <tr>
                    <th class="px-4 py-3 rounded-tl-xl">Fecha</th>
                    <th class="px-4 py-3">Hora</th>
                    <th class="px-4 py-3">Cliente</th>
                    <th class="px-4 py-3">Servicio</th>
                    <th class="px-4 py-3 text-right">Valor</th>
                    <th class="px-4 py-3 text-center">Estado</th>
                    <th class="px-4 py-3 text-right rounded-tr-xl">Acción</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @for (apt of upcomingAppointments; track apt.id) {
                    <tr class="transition-colors hover:bg-gray-50/60">
                      <td class="px-4 py-3 whitespace-nowrap font-medium text-text-primary">{{ apt.date }}</td>
                      <td class="px-4 py-3 whitespace-nowrap text-text-secondary">{{ apt.time }}</td>
                      <td class="px-4 py-3">
                        <span class="block max-w-[150px] truncate font-medium text-text-primary">{{ apt.client_name }}</span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="block max-w-[170px] truncate text-text-primary">{{ apt.service_name }}</span>
                      </td>
                      <td class="px-4 py-3 text-right whitespace-nowrap text-text-primary">
                        {{ formatPrice(apt.service_price) }}
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span class="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                          [ngClass]="{
                            'bg-blue-100 text-blue-700': apt.status === 'confirmed',
                            'bg-yellow-100 text-yellow-700': apt.status === 'pending',
                            'bg-green-100 text-green-700': apt.status === 'completed',
                            'bg-red-100 text-red-700': apt.status === 'cancelled',
                            'bg-gray-100 text-gray-700': apt.status === 'no_show'
                          }">
                          {{ getStatusLabel(apt.status) }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button
                          type="button"
                          (click)="openAppointmentModal(apt.id)"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary-light hover:text-primary"
                          title="Editar"
                          aria-label="Editar cita"
                        >
                          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
      </div>

      @if (showAppointmentModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h3 class="text-lg font-bold text-text-primary">Editar cita</h3>
              <button type="button" (click)="closeAppointmentModal()" class="text-gray-400 hover:text-gray-600 text-xl font-bold p-2 leading-none">&times;</button>
            </div>

            @if (appointmentModalLoading) {
              <div class="p-8 text-center text-text-secondary animate-pulse">Cargando cita...</div>
            } @else {
              <form [formGroup]="appointmentForm" (ngSubmit)="saveAppointment()" class="p-6 space-y-4">
                @if (appointmentErrorMessage) {
                  <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {{ appointmentErrorMessage }}
                  </div>
                }

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Cliente *</label>
                    <input type="text" formControlName="client_name" class="form-input" />
                  </div>
                  <div>
                    <label class="form-label">Teléfono</label>
                    <input type="tel" formControlName="client_phone" class="form-input" />
                  </div>
                </div>

                <div>
                  <label class="form-label">Email</label>
                  <input type="email" formControlName="client_email" class="form-input" />
                </div>

                <div>
                  <label class="form-label">Servicio *</label>
                  <select formControlName="service_id" class="form-input">
                    <option value="">Seleccione...</option>
                    @for (service of appointmentServices; track service.id) {
                      <option [value]="service.id">{{ service.name }} ({{ service.duration_minutes }} min - {{ service.price | number:'1.0-0' }} CLP)</option>
                    }
                  </select>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label class="form-label">Fecha *</label>
                    <input type="date" formControlName="date" class="form-input" />
                  </div>
                  <div>
                    <label class="form-label">Hora *</label>
                    <input type="time" formControlName="time" class="form-input" />
                  </div>
                  <div>
                    <label class="form-label">Estado *</label>
                    <select formControlName="status" class="form-input">
                      <option value="pending">Pendiente</option>
                      <option value="confirmed">Confirmada</option>
                      <option value="completed">Completada</option>
                      <option value="no_show">No asistió</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="form-label">Notas</label>
                  <textarea formControlName="notes" class="form-input" rows="3"></textarea>
                </div>

                <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" class="btn-secondary" (click)="closeAppointmentModal()">Cancelar</button>
                  <button type="submit" class="btn-primary" [disabled]="appointmentSaving">
                    {{ appointmentSaving ? 'Guardando...' : 'Guardar cambios' }}
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      }

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
  appointmentsLoading = true;
  appointmentFiltersExpanded = false;
  upcomingAppointments: any[] = [];
  activeFinanceType: 'Ingresos' | 'Egresos' = 'Ingresos';
  categories: ExpenseCategory[] = [];
  showTxModal = false;
  showCatModal = false;
  showQrModal = false;
  showAppointmentModal = false;
  saving = false;
  appointmentSaving = false;
  appointmentModalLoading = false;
  newCatName = '';
  copyLinkLabel = 'Copiar enlace';
  selectedAppointmentId: number | null = null;
  appointmentErrorMessage = '';
  txForm: FormGroup;
  appointmentForm: FormGroup;
  appointmentServices: ServiceOption[] = [];

  kpis: any[] = [
    { label: 'Citas Hoy', value: '0', iconPath: 'assets/Interfaz/Citas.png', iconBg: '#EFF6FF', trend: 'Hoy', trendColor: 'text-text-secondary' },
    { label: 'Ingresos (Mes)', value: '$0', iconPath: 'assets/Interfaz/Finanzas.png', iconBg: '#F0FDF4', trend: 'Actual', trendColor: 'text-success' },
    { label: 'Egresos (Mes)', value: '$0', iconPath: 'assets/Interfaz/Finanzas.png', iconBg: '#FEF2F2', trend: 'Actual', trendColor: 'text-danger' },
    { label: 'Balance', value: '$0', iconPath: 'assets/Interfaz/Dashboard.png', iconBg: '#F8FAFC', trend: 'Mensual', trendColor: 'text-text-secondary' },
  ];

  appointmentFilters: AppointmentFilters = {
    search: '',
    status: '',
    date: '',
    sort_by: 'scheduled_at',
    sort_dir: 'desc',
  };

  constructor(
    private fb: FormBuilder,
    private dashboardService: DashboardService,
    private appointmentsService: AppointmentsService,
    private toastService: ToastService,
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

    this.appointmentForm = this.fb.group({
      client_name: ['', Validators.required],
      client_email: [''],
      client_phone: [''],
      service_id: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      status: ['pending', Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
    void this.loadAppointments();
    void this.loadAppointmentServices();
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

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No asistió',
    };

    return labels[status] ?? status;
  }

  formatPrice(value: unknown): string {
    const amount = Number(value);
    const safeAmount = Number.isFinite(amount) ? amount : 0;

    return `$${new Intl.NumberFormat('es-CL', {
      maximumFractionDigits: 0,
    }).format(safeAmount)}`;
  }

  applyAppointmentFilters(): void {
    this.appointmentFiltersExpanded = false;
    void this.loadAppointments();
  }

  toggleAppointmentFilters(): void {
    this.appointmentFiltersExpanded = !this.appointmentFiltersExpanded;
  }

  async loadAppointments(): Promise<void> {
    this.appointmentsLoading = true;

    try {
      const appointments = await this.appointmentsService.list(this.appointmentFilters);
      this.upcomingAppointments = appointments.map(appointment => this.mapAppointment(appointment));
    } catch (error: any) {
      this.toastService.error(error?.message ?? 'No se pudieron cargar las citas.');
    } finally {
      this.appointmentsLoading = false;
    }
  }

  private mapAppointment(appointment: AppointmentRow): any {
    const servicePrice = Number(appointment.service?.price ?? 0);

    return {
      id: appointment.id,
      client_name: appointment.client_name,
      service_name: appointment.service?.name ?? 'Cita personalizada',
      service_price: Number.isFinite(servicePrice) ? servicePrice : 0,
      status: appointment.status,
      date: this.formatDate(appointment.scheduled_at),
      time: this.formatTime(appointment.scheduled_at),
    };
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Santiago',
    });
  }

  private formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago',
    });
  }

  async openAppointmentModal(appointmentId: number): Promise<void> {
    this.showAppointmentModal = true;
    this.appointmentModalLoading = true;
    this.appointmentErrorMessage = '';
    this.selectedAppointmentId = appointmentId;
    this.appointmentForm.reset({ status: 'pending' });

    try {
      if (this.appointmentServices.length === 0) {
        await this.loadAppointmentServices();
      }

      const appointment = await this.appointmentsService.find(appointmentId);
      const date = new Date(appointment.scheduled_at);

      this.appointmentForm.patchValue({
        client_name: appointment.client_name,
        client_email: appointment.client_email ?? '',
        client_phone: appointment.client_phone ?? '',
        service_id: appointment.service_id,
        date: date.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' }),
        time: date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'America/Santiago',
        }),
        status: appointment.status,
        notes: appointment.notes ?? '',
      });
    } catch (error: any) {
      this.appointmentErrorMessage = error?.message ?? 'No se pudo cargar la cita.';
    } finally {
      this.appointmentModalLoading = false;
    }
  }

  closeAppointmentModal(): void {
    this.showAppointmentModal = false;
    this.appointmentModalLoading = false;
    this.appointmentSaving = false;
    this.selectedAppointmentId = null;
    this.appointmentErrorMessage = '';
  }

  async saveAppointment(): Promise<void> {
    if (this.appointmentForm.invalid || !this.selectedAppointmentId) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    this.appointmentSaving = true;
    this.appointmentErrorMessage = '';

    try {
      const value = this.appointmentForm.value;
      await this.appointmentsService.update(this.selectedAppointmentId, {
        client_name: value.client_name,
        client_email: value.client_email || null,
        client_phone: value.client_phone || null,
        service_id: Number(value.service_id),
        scheduled_at: new Date(`${value.date}T${value.time}:00`).toISOString(),
        status: value.status,
        notes: value.notes || null,
      });

      this.toastService.success('Cita actualizada');
      this.closeAppointmentModal();
      void this.loadAppointments();
      this.loadData();
    } catch (error: any) {
      this.appointmentErrorMessage = error?.message ?? 'No se pudo actualizar la cita.';
    } finally {
      this.appointmentSaving = false;
    }
  }

  private async loadAppointmentServices(): Promise<void> {
    const business = this.businessService.currentBusiness();
    if (!business) return;

    const { data, error } = await this.supabase.client
      .from('services')
      .select('id, name, duration_minutes, price')
      .eq('business_id', business.id)
      .order('name');

    if (error) {
      this.toastService.error(error.message);
      return;
    }

    this.appointmentServices = (data ?? []).map((service: any) => ({
      id: service.id,
      name: service.name,
      duration_minutes: Number(service.duration_minutes),
      price: Number(service.price ?? 0),
    }));
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

