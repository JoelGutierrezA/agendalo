import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { environment } from '../../../../../environments/environment';

interface Appointment {
  id: number;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  service?: { name: string; price: number };
}

import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

/** Listado de citas con filtros y tabla */
@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, EmptyStateComponent],
  template: `
    <div>
      <div class="page-header flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div>
          <h1 class="page-title">Citas</h1>
          <p class="text-text-secondary text-sm">Gestiona todas las reservas de tu negocio</p>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <a routerLink="/app/agenda" class="btn-secondary flex-1 sm:flex-none justify-center">📅 Calendario</a>
          <a routerLink="/app/citas/nueva" class="btn-primary flex-1 sm:flex-none justify-center"><span>+</span> Nueva cita</a>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card mb-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Buscar</label>
            <input type="text" [(ngModel)]="filters.search" (keyup.enter)="loadAppointments()" class="form-input w-full" placeholder="Nombre, email o teléfono..." />
          </div>
          <div class="w-full sm:w-40">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Estado</label>
            <select [(ngModel)]="filters.status" (change)="loadAppointments()" class="form-input w-full">
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No asistió</option>
            </select>
          </div>
          <div class="w-full sm:w-40">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Fecha</label>
            <input type="date" [(ngModel)]="filters.date" (change)="loadAppointments()" class="form-input w-full" />
          </div>
          <div class="w-full sm:w-56">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Ordenar por</label>
            <select [(ngModel)]="filters.sort_by" (change)="loadAppointments()" class="form-input w-full">
              <option value="scheduled_at">Fecha de la cita (más reciente)</option>
              <option value="created_at">Fecha de creación (más reciente)</option>
            </select>
          </div>
          <button (click)="loadAppointments()" class="btn-secondary h-[42px] px-6">Filtrar</button>
          
          @if (hasFilters()) {
            <button (click)="clearFilters()" class="text-sm text-primary hover:underline h-[42px] px-2">Limpiar</button>
          }
        </div>
      </div>

      <!-- Tabla -->
      <div class="card p-0 overflow-hidden">
        @if (loading) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50/50 border-b border-border">
                <tr>
                  <th class="px-5 py-3 h-10 w-32"><div class="skeleton h-4 w-20"></div></th>
                  <th class="px-5 py-3 h-10"><div class="skeleton h-4 w-32"></div></th>
                  <th class="px-5 py-3 h-10"><div class="skeleton h-4 w-40"></div></th>
                  <th class="px-5 py-3 h-10 text-center"><div class="skeleton h-4 w-16 mx-auto"></div></th>
                  <th class="px-5 py-3 h-10 text-right"><div class="skeleton h-4 w-24 ml-auto"></div></th>
                </tr>
              </thead>
              <tbody>
                @for (i of [1,2,3,4,5]; track i) {
                  <tr>
                    <td class="px-5 py-4"><div class="skeleton-text w-24"></div><div class="skeleton-text w-32 h-3 mt-2"></div></td>
                    <td class="px-5 py-4"><div class="skeleton-text w-32"></div><div class="skeleton-text w-24 h-3 mt-2"></div></td>
                    <td class="px-5 py-4"><div class="skeleton-text w-40"></div><div class="skeleton-text w-20 h-3 mt-2"></div></td>
                    <td class="px-5 py-4 text-center"><div class="skeleton w-16 h-6 rounded-full mx-auto"></div></td>
                    <td class="px-5 py-4 text-right"><div class="skeleton w-24 h-8 rounded-lg ml-auto"></div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (appointments.length === 0) {
          <app-empty-state
            icon="📋"
            title="No hay citas"
            [description]="hasFilters() ? 'Ninguna cita coincide con los filtros de búsqueda.' : 'Crea tu primera cita o espera reservas públicas.'"
            [actionLabel]="!hasFilters() ? 'Crear primera cita' : undefined"
            (onAction)="router.navigate(['/app/citas/nueva'])"
          ></app-empty-state>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50/50 border-b border-border text-text-secondary font-medium">
                <tr>
                  <th class="px-5 py-3 rounded-tl-xl whitespace-nowrap">Fecha y Hora</th>
                  <th class="px-5 py-3">Cliente</th>
                  <th class="px-5 py-3">Servicio</th>
                  <th class="px-5 py-3 text-center">Estado</th>
                  <th class="px-5 py-3 text-right rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                @for (apt of appointments; track apt.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-5 py-3 whitespace-nowrap">
                      <p class="font-medium text-text-primary">{{ formatDate(apt.scheduled_at) }}</p>
                      <p class="text-xs text-text-secondary">{{ formatTime(apt.scheduled_at) }} ({{ apt.duration_minutes }} min)</p>
                    </td>
                    <td class="px-5 py-3">
                      <p class="font-medium text-text-primary">{{ apt.client_name }}</p>
                      @if (apt.client_phone) {
                        <p class="text-xs text-text-secondary flex items-center gap-1">
                          <span>📞</span> {{ apt.client_phone }}
                        </p>
                      }
                    </td>
                    <td class="px-5 py-3">
                      <p class="text-text-primary">{{ apt.service?.name || 'Personalizado' }}</p>
                      @if (apt.service?.price) {
                        <p class="text-xs text-text-secondary">{{ apt.service?.price | number:'1.0-0' }} CLP</p>
                      }
                    </td>
                    <td class="px-5 py-3 text-center">
                      <span class="inline-block px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap"
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
                    <td class="px-5 py-3">
                      <div class="flex items-center justify-end gap-2">
                        <!-- Dropdown rápido de estado -->
                        <select 
                          class="form-input py-1 px-2 text-xs w-auto bg-transparent border-transparent hover:border-border cursor-pointer appearance-none text-right"
                          [ngModel]="apt.status"
                          (change)="updateStatus(apt, $event)"
                          title="Cambiar estado"
                          [disabled]="statusUpdating === apt.id"
                        >
                          <option value="pending">Marcar Pendiente</option>
                          <option value="confirmed">Marcar Confirmada</option>
                          <option value="completed">Marcar Completada</option>
                          <option value="no_show">Marcar No asistió</option>
                          <option value="cancelled">Cancelar cita</option>
                        </select>

                        <a 
                          [routerLink]="['/app/citas', apt.id, 'editar']" 
                          class="p-1.5 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary-light"
                          title="Editar"
                        >✏️</a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Todo: Pagination controls -->
    </div>
  `,
})
export class AppointmentsListComponent implements OnInit {
  appointments: Appointment[] = [];
  loading = true;
  statusUpdating: number | null = null;
  
  filters = {
    search: '',
    status: '',
    date: '',
    sort_by: 'scheduled_at',
    sort_dir: 'desc'
  };

  constructor(
    private http: HttpClient,
    public router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    
    // Construir query params
    const params: any = {};
    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.date) params.date = this.filters.date;
    params.sort_by = this.filters.sort_by;
    params.sort_dir = this.filters.sort_dir;

    this.http.get<{ data: { data: Appointment[] } }>(`${environment.apiUrl}/appointments`, { params }).subscribe({
      next: (res) => {
        this.appointments = res.data.data; // Porque usamos paginate() en Laravel
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  updateStatus(apt: Appointment, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value;
    
    if (newStatus === 'cancelled') {
        if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
            select.value = apt.status; // Revertir select
            return;
        }
    }

    this.statusUpdating = apt.id;
    
    this.http.patch<{ data: Appointment }>(`${environment.apiUrl}/appointments/${apt.id}/status`, { status: newStatus }).subscribe({
      next: (res) => {
        // Actualizar el estado local
        const idx = this.appointments.findIndex(a => a.id === apt.id);
        if (idx !== -1) {
            this.appointments[idx] = res.data;
        }
        this.toastService.success(`Cita marcada como ${this.getStatusLabel(newStatus)}`);
        this.statusUpdating = null;
      },
      error: () => {
        select.value = apt.status; // Revertir select
        this.statusUpdating = null;
      }
    });
  }

  hasFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.status ||
      this.filters.date ||
      this.filters.sort_by !== 'scheduled_at' ||
      this.filters.sort_dir !== 'desc'
    );
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      status: '',
      date: '',
      sort_by: 'scheduled_at',
      sort_dir: 'desc'
    };
    this.loadAppointments();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: 'America/Santiago'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago'
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'no_show': 'No asistió'
    };
    return labels[status] || status;
  }
}
