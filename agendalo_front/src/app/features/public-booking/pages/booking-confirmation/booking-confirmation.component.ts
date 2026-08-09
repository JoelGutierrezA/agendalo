import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';

interface ConfirmationData {
  business_name: string;
  service_name: string;
  client_name: string;
  scheduled_at: string;
  status: string;
}

@Component({
  selector: 'app-booking-confirmation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto py-12 px-4 text-center">
      @if (loading) {
        <div class="py-20 flex flex-col items-center justify-center space-y-4">
          <div class="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
          <p class="text-text-secondary">Cargando detalles de tu reserva...</p>
        </div>
      } @else if (error || !data) {
        <div class="bg-white rounded-2xl shadow-sm border border-border p-8 py-16">
          <h1 class="text-2xl font-bold text-text-primary mb-2">No pudimos cargar la reserva</h1>
          <p class="text-text-secondary max-w-sm mx-auto">
            Es posible que el enlace haya expirado o haya un problema de conexion temporal.
          </p>
          <a [routerLink]="['/negocio', slug]" class="btn-primary inline-flex mt-6 px-8">Volver al inicio</a>
        </div>
      } @else {
        <div class="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <div class="bg-green-500 py-8 px-6 text-white">
            <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <span class="text-3xl">✓</span>
            </div>
            <h1 class="text-2xl md:text-3xl font-bold mb-2">Reserva confirmada</h1>
            <p class="text-green-50 text-sm md:text-base">Hola {{ data.client_name }}, tu cita ha sido agendada con exito.</p>
          </div>

          <div class="p-6 md:p-10 text-left">
            <h2 class="text-lg font-bold text-text-primary mb-6 text-center border-b border-border pb-4">
              Detalles de tu cita en <span class="text-primary">{{ data.business_name }}</span>
            </h2>

            <div class="space-y-6 max-w-md mx-auto">
              <div>
                <p class="text-sm font-medium text-text-secondary">Fecha</p>
                <p class="text-lg font-bold text-text-primary mt-0.5">{{ formatDate(data.scheduled_at) }}</p>
              </div>

              <div>
                <p class="text-sm font-medium text-text-secondary">Hora</p>
                <p class="text-lg font-bold text-text-primary mt-0.5">{{ formatTime(data.scheduled_at) }}</p>
              </div>

              <div>
                <p class="text-sm font-medium text-text-secondary">Servicio</p>
                <p class="text-lg font-bold text-text-primary mt-0.5">{{ data.service_name }}</p>
              </div>

              <div>
                <p class="text-sm font-medium text-text-secondary">Estado actual</p>
                <span class="inline-block mt-1 px-2.5 py-1 text-xs font-semibold rounded-full"
                      [ngClass]="data.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                  {{ data.status === 'confirmed' ? 'Confirmada automaticamente' : 'Pendiente de revision' }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-gray-50 py-5 px-6 border-t border-border flex flex-col gap-3 sm:flex-row justify-center mt-4">
            <button onclick="window.print()" class="btn-secondary whitespace-nowrap">Imprimir</button>
            <a [routerLink]="['/negocio', slug]" class="btn-primary whitespace-nowrap">Volver al negocio</a>
          </div>
        </div>
      }
    </div>
  `
})
export class BookingConfirmationComponent implements OnInit {
  appointmentId: string | null = null;
  slug = '';

  loading = true;
  error = false;
  data: ConfirmationData | null = null;

  constructor(
    private route: ActivatedRoute,
    private supabase: SupabaseService
  ) {}

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    this.appointmentId = this.route.snapshot.queryParamMap.get('appointment');

    if (this.appointmentId) {
      void this.loadConfirmation();
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  async loadConfirmation(): Promise<void> {
    const { data, error } = await this.supabase.client.rpc('get_public_booking_confirmation', {
      target_appointment_id: Number(this.appointmentId),
    });

    if (error || !data?.length) {
      this.error = true;
      this.loading = false;
      return;
    }

    this.data = data[0];
    this.loading = false;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
