import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { BusinessService } from '../../../settings/services/business.service';
import { SupabaseService } from '../../../../core/services/supabase.service';

interface AppointmentHistory {
  id: number;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  service?: { name: string; price: number | null } | null;
}

interface ClientDetail {
  id: number;
  business_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  last_visit_at: string | null;
  appointments_count: number;
  created_at: string;
}

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div>
      <a routerLink="/app/clientes" class="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary mb-5 transition-colors">
        <- Volver a clientes
      </a>

      @if (loadingClient) {
        <div class="card py-20 text-center animate-pulse text-text-secondary">Cargando perfil del cliente...</div>
      } @else if (!client) {
        <div class="card py-20 text-center">
          <p class="font-bold text-text-primary mt-4">Cliente no encontrado</p>
          <a routerLink="/app/clientes" class="text-primary hover:underline text-sm mt-2 block">Regresar</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="space-y-6 lg:self-start">
            <div class="card">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-primary text-2xl font-bold align-middle shadow-inner">
                  {{ client.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h2 class="text-xl font-bold text-text-primary">{{ client.name }}</h2>
                  <p class="text-text-secondary text-sm">Cliente desde {{ formatDateOnly(client.created_at) }}</p>
                </div>
              </div>

              <div class="space-y-4 text-sm divide-y divide-gray-50">
                <div class="pt-2 flex justify-between items-center group">
                  <span class="text-text-secondary">Email</span>
                  <span class="font-medium text-text-primary text-right break-all">{{ client.email || '-' }}</span>
                </div>
                <div class="pt-3 flex justify-between items-center group">
                  <span class="text-text-secondary">Telefono</span>
                  <span class="font-medium text-text-primary">{{ client.phone || '-' }}</span>
                </div>
                <div class="pt-3 flex justify-between items-center group">
                  <span class="text-text-secondary">Ultima visita</span>
                  <span class="font-medium text-text-primary">{{ client.last_visit_at ? formatDateOnly(client.last_visit_at) : '-' }}</span>
                </div>
                <div class="pt-3 flex justify-between items-center group">
                  <span class="text-text-secondary">Citas totales</span>
                  <span class="font-medium text-primary bg-primary-light px-2 py-0.5 rounded-full text-xs">{{ client.appointments_count }}</span>
                </div>
              </div>

              @if (client.notes) {
                <div class="mt-6 pt-4 border-t border-border">
                  <p class="text-xs text-text-secondary font-medium uppercase tracking-wider mb-2">Notas internas / Alergias</p>
                  <p class="text-sm text-text-primary bg-orange-50 border border-orange-100 p-3 rounded-lg leading-relaxed">{{ client.notes }}</p>
                </div>
              }

              <div class="mt-6 pt-6 border-t border-border flex flex-col gap-3">
                <a [routerLink]="['/app/citas/nueva']" [queryParams]="{ client: client.id }" class="btn-primary w-full justify-center">
                  Agendar cita
                </a>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div class="card p-0 overflow-hidden h-full flex flex-col">
              <div class="p-5 sm:p-6 border-b border-border bg-gray-50/50 flex justify-between items-center">
                <h3 class="text-lg font-bold text-text-primary">Historial de citas</h3>
              </div>

              <div class="flex-1">
                @if (loadingHistory) {
                  <div class="py-12 text-center text-text-secondary animate-pulse">Cargando historial...</div>
                } @else if (history.length === 0) {
                  <div class="empty-state py-16">
                    <p class="font-medium text-text-primary mt-3">Sin historial aun</p>
                    <p class="text-text-secondary text-sm mt-1">Este cliente no ha tenido citas todavia.</p>
                  </div>
                } @else {
                  <div class="divide-y divide-border">
                    @for (apt of history; track apt.id) {
                      <div class="p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                        <div class="flex items-start sm:items-center gap-4">
                          <div class="w-14 h-14 rounded-xl border border-gray-200 bg-white flex flex-col items-center justify-center shrink-0 shadow-sm text-center">
                            <span class="text-[10px] font-bold uppercase text-red-500 tracking-wider leading-none">{{ getMonthShort(apt.scheduled_at) }}</span>
                            <span class="text-xl font-bold text-gray-800 leading-none mt-1">{{ getDay(apt.scheduled_at) }}</span>
                          </div>

                          <div>
                            <p class="font-bold text-text-primary text-base">{{ apt.service?.name || 'Cita personalizada' }}</p>
                            <div class="flex items-center gap-3 mt-1 text-sm text-text-secondary">
                              <span>{{ getTime(apt.scheduled_at) }}</span>
                              <span class="text-gray-300">|</span>
                              <span>{{ apt.duration_minutes }} min</span>
                            </div>
                            @if (apt.service?.price) {
                              <p class="text-xs font-medium text-text-secondary mt-1">{{ apt.service?.price | number:'1.0-0' }} CLP</p>
                            }
                          </div>
                        </div>

                        <div class="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                          <span class="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap"
                            [ngClass]="{
                              'bg-green-100 text-green-700': apt.status === 'completed',
                              'bg-blue-100 text-blue-700': apt.status === 'confirmed',
                              'bg-yellow-100 text-yellow-700': apt.status === 'pending',
                              'bg-red-100 text-red-700': apt.status === 'cancelled',
                              'bg-gray-100 text-gray-700': apt.status === 'no_show'
                            }">
                            {{ getStatusLabel(apt.status) }}
                          </span>

                          <a [routerLink]="['/app/citas', apt.id]" class="p-2 text-text-secondary hover:text-primary bg-white rounded-lg border border-gray-200 shadow-sm transition-colors" title="Ver detalle de cita">
                            Ver
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ClientDetailComponent implements OnInit {
  clientId: number | null = null;
  client: ClientDetail | null = null;
  history: AppointmentHistory[] = [];

  loadingClient = true;
  loadingHistory = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private supabase: SupabaseService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) {
      void this.router.navigate(['/app/clientes']);
      return;
    }

    this.clientId = id;
    void this.loadClient();
  }

  async loadClient(): Promise<void> {
    const business = this.businessService.currentBusiness();
    if (!business || !this.clientId) {
      this.loadingClient = false;
      return;
    }

    try {
      const { data, error } = await this.supabase.client
        .from('clients')
        .select('*')
        .eq('id', this.clientId)
        .eq('business_id', business.id)
        .single();

      if (error || !data) throw new Error(error?.message ?? 'Cliente no encontrado.');

      this.client = {
        ...(data as Omit<ClientDetail, 'appointments_count'>),
        appointments_count: 0,
      };

      this.loadingClient = false;
      await this.loadHistory();
    } catch {
      this.client = null;
      this.loadingClient = false;
    }
  }

  async loadHistory(): Promise<void> {
    const business = this.businessService.currentBusiness();
    if (!business || !this.clientId) return;

    this.loadingHistory = true;
    try {
      const { data, error } = await this.supabase.client
        .from('appointments')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          service:services(name, price)
        `)
        .eq('business_id', business.id)
        .eq('client_id', this.clientId)
        .order('scheduled_at', { ascending: false });

      if (error) throw new Error(error.message);

      this.history = (data ?? []).map((appointment: any) => ({
        ...appointment,
        service: Array.isArray(appointment.service) ? appointment.service[0] : appointment.service,
      }));

      if (this.client) {
        this.client = {
          ...this.client,
          appointments_count: this.history.length,
          last_visit_at: this.getLastCompletedVisit(this.history) ?? this.client.last_visit_at,
        };
      }
    } finally {
      this.loadingHistory = false;
    }
  }

  formatDateOnly(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getMonthShort(dStr: string): string {
    return new Date(dStr).toLocaleDateString('es-CL', { month: 'short' }).substring(0, 3);
  }

  getDay(dStr: string): number {
    return new Date(dStr).getDate();
  }

  getTime(dStr: string): string {
    return new Date(dStr).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No asistio',
    };
    return map[status] || status;
  }

  private getLastCompletedVisit(history: AppointmentHistory[]): string | null {
    return history.find(appointment => appointment.status === 'completed')?.scheduled_at ?? null;
  }
}
