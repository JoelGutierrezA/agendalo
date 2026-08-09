import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { AppointmentRow, AppointmentStatus, AppointmentsService } from '../../services/appointments.service';

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
          <a routerLink="/app/agenda" class="btn-secondary flex-1 sm:flex-none justify-center">Calendario</a>
          <a routerLink="/app/citas/nueva" class="btn-primary flex-1 sm:flex-none justify-center"><span>+</span> Nueva cita</a>
        </div>
      </div>

      <div class="card mb-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Buscar</label>
            <input type="text" [(ngModel)]="filters.search" (keyup.enter)="loadAppointments()" class="form-input w-full" placeholder="Nombre, email o telefono..." />
          </div>
          <div class="w-full sm:w-40">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Estado</label>
            <select [(ngModel)]="filters.status" (change)="loadAppointments()" class="form-input w-full">
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No asistio</option>
            </select>
          </div>
          <div class="w-full sm:w-40">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Fecha</label>
            <input type="date" [(ngModel)]="filters.date" (change)="loadAppointments()" class="form-input w-full" />
          </div>
          <div class="w-full sm:w-56">
            <label class="text-xs text-text-secondary font-medium mb-1 block">Ordenar por</label>
            <select [(ngModel)]="filters.sort_by" (change)="loadAppointments()" class="form-input w-full">
              <option value="scheduled_at">Fecha de la cita</option>
              <option value="created_at">Fecha de creacion</option>
            </select>
          </div>
          <button (click)="loadAppointments()" class="btn-secondary h-[42px] px-6">Filtrar</button>

          @if (hasFilters()) {
            <button (click)="clearFilters()" class="text-sm text-primary hover:underline h-[42px] px-2">Limpiar</button>
          }
        </div>
      </div>

      <div class="card p-0 overflow-hidden">
        @if (loading) {
          <div class="py-16 text-center text-text-secondary animate-pulse">Cargando citas...</div>
        } @else if (appointments.length === 0) {
          <app-empty-state
            icon="📋"
            title="No hay citas"
            [description]="hasFilters() ? 'Ninguna cita coincide con los filtros de busqueda.' : 'Crea tu primera cita o espera reservas publicas.'"
            [actionLabel]="!hasFilters() ? 'Crear primera cita' : undefined"
            (onAction)="router.navigate(['/app/citas/nueva'])"
          ></app-empty-state>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50/50 border-b border-border text-text-secondary font-medium">
                <tr>
                  <th class="px-5 py-3 rounded-tl-xl whitespace-nowrap">Fecha y hora</th>
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
                        <p class="text-xs text-text-secondary">{{ apt.client_phone }}</p>
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
                        <select
                          class="form-input py-1 px-2 text-xs w-auto bg-transparent border-transparent hover:border-border cursor-pointer appearance-none text-right"
                          [ngModel]="apt.status"
                          (change)="updateStatus(apt, $event)"
                          title="Cambiar estado"
                          [disabled]="statusUpdating === apt.id"
                        >
                          <option value="pending">Marcar pendiente</option>
                          <option value="confirmed">Marcar confirmada</option>
                          <option value="completed">Marcar completada</option>
                          <option value="no_show">Marcar no asistio</option>
                          <option value="cancelled">Cancelar cita</option>
                        </select>

                        <a
                          [routerLink]="['/app/citas', apt.id, 'editar']"
                          class="p-1.5 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary-light"
                          title="Editar"
                        >Editar</a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `,
})
export class AppointmentsListComponent implements OnInit {
  appointments: AppointmentRow[] = [];
  loading = true;
  statusUpdating: number | null = null;

  filters = {
    search: '',
    status: '',
    date: '',
    sort_by: 'scheduled_at',
    sort_dir: 'desc' as const,
  };

  constructor(
    public router: Router,
    private toastService: ToastService,
    private appointmentsService: AppointmentsService
  ) {}

  ngOnInit(): void {
    void this.loadAppointments();
  }

  async loadAppointments(): Promise<void> {
    this.loading = true;
    try {
      this.appointments = await this.appointmentsService.list(this.filters);
    } catch (error: any) {
      this.toastService.error(error?.message ?? 'No se pudieron cargar las citas.');
    } finally {
      this.loading = false;
    }
  }

  async updateStatus(apt: AppointmentRow, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as AppointmentStatus;

    if (newStatus === 'cancelled' && !confirm('Estas seguro de que deseas cancelar esta cita?')) {
      select.value = apt.status;
      return;
    }

    this.statusUpdating = apt.id;

    try {
      const updated = await this.appointmentsService.updateStatus(apt, newStatus);
      const idx = this.appointments.findIndex(item => item.id === apt.id);
      if (idx !== -1) this.appointments[idx] = updated;
      this.toastService.success(`Cita marcada como ${this.getStatusLabel(newStatus)}`);
    } catch (error: any) {
      select.value = apt.status;
      this.toastService.error(error?.message ?? 'No se pudo cambiar el estado.');
    } finally {
      this.statusUpdating = null;
    }
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
      sort_dir: 'desc',
    };
    void this.loadAppointments();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      timeZone: 'America/Santiago',
    });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago',
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No asistio',
    };
    return labels[status] || status;
  }
}
