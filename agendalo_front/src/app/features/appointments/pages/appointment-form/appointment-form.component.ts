import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { BusinessService } from '../../../settings/services/business.service';
import { AppointmentStatus, AppointmentsService } from '../../services/appointments.service';

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <div class="page-header">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/Interfaz/Citas.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
            <h1 class="page-title">{{ isEditing ? 'Editar cita' : 'Nueva cita' }}</h1>
          </div>
        </div>
        <a routerLink="/app/citas" class="btn-secondary">Volver</a>
      </div>

      <div class="card relative">
        @if (loadingData) {
          <div class="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <span class="text-text-secondary animate-pulse">Cargando datos...</span>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="form-label">Nombre del cliente *</label>
            <input type="text" formControlName="client_name" class="form-input" placeholder="Ej: Juan Pérez" />
            @if (form.get('client_name')?.invalid && form.get('client_name')?.touched) {
              <p class="form-error">El nombre es requerido</p>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Email del cliente</label>
              <input type="email" formControlName="client_email" class="form-input" placeholder="cliente&#64;correo.com" />
              @if (form.get('client_email')?.invalid && form.get('client_email')?.touched) {
                <p class="form-error">Email inválido</p>
              }
            </div>
            <div>
              <label class="form-label">Teléfono del cliente *</label>
              <div class="input-group">
                <span class="input-prefix">+56 9</span>
                <input type="tel" formControlName="client_phone" class="form-input" placeholder="12345678" maxlength="8" />
              </div>
              @if (form.get('client_phone')?.invalid && form.get('client_phone')?.touched) {
                <p class="form-error">Ingresa los 8 dígitos</p>
              }
            </div>
          </div>

          <div>
            <label class="form-label">Servicio *</label>
            <select formControlName="service_id" class="form-input" (change)="onDateChange()">
              <option value="">Seleccionar servicio</option>
              @for (service of services; track service.id) {
                <option [value]="service.id">{{ service.name }} ({{ service.duration_minutes }} min - {{ service.price | number:'1.0-0' }} CLP)</option>
              }
            </select>
            @if (form.get('service_id')?.invalid && form.get('service_id')?.touched) {
              <p class="form-error">Debes seleccionar un servicio</p>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Fecha *</label>
              <input type="date" formControlName="date" class="form-input" (change)="onDateChange()" />
              @if (form.get('date')?.invalid && form.get('date')?.touched) {
                <p class="form-error">La fecha es requerida</p>
              }
              @if (dayClosed) {
                <p class="text-amber-600 text-[11px] mt-1 font-medium">El negocio está cerrado este día.</p>
              }
            </div>
            <div>
              <label class="form-label">Hora *</label>
              <select formControlName="time" class="form-input">
                <option value="">Seleccionar hora</option>
                @for (time of timeOptions; track time) {
                  <option [value]="time">{{ time }}</option>
                }
              </select>
              @if (form.get('time')?.invalid && form.get('time')?.touched) {
                <p class="form-error">La hora es requerida</p>
              }
            </div>
          </div>

          <div>
            <label class="form-label">Observaciones</label>
            <textarea formControlName="notes" class="form-input" rows="3" placeholder="Notas internas sobre esta cita..."></textarea>
          </div>

          <div>
            <label class="form-label">Estado</label>
            <select formControlName="status" class="form-input">
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              @if (isEditing) {
                <option value="completed">Completada (registra ingreso)</option>
                <option value="no_show">No asistió</option>
                <option value="cancelled">Cancelada</option>
              }
            </select>
          </div>

          @if (errorMessage) {
            <div class="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {{ errorMessage }}
            </div>
          }

          <div class="flex gap-3 justify-end pt-2 border-t border-border">
            <a routerLink="/app/citas" class="btn-secondary">Cancelar</a>
            <button type="submit" class="btn-primary" [disabled]="saving || loadingData">
              @if (saving) { Guardando... } @else { {{ isEditing ? 'Actualizar cita' : 'Crear cita' }} }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AppointmentFormComponent implements OnInit {
  form: FormGroup;
  services: Service[] = [];

  isEditing = false;
  appointmentId: number | null = null;

  loadingData = true;
  saving = false;
  errorMessage = '';
  timeOptions: string[] = [];
  openingHours: any[] = [];
  dayClosed = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private businessService: BusinessService,
    private supabase: SupabaseService,
    private appointmentsService: AppointmentsService
  ) {
    this.generateTimeOptions();
    this.form = this.fb.group({
      client_name: ['', Validators.required],
      client_email: ['', [Validators.email]],
      client_phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      service_id: ['', Validators.required],
      date: ['', Validators.required],
      time: ['', Validators.required],
      notes: [''],
      status: ['pending', Validators.required],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'nueva') {
      this.isEditing = true;
      this.appointmentId = Number(idParam);
    }

    void this.loadInitialData();
    this.form.get('service_id')?.valueChanges.subscribe(() => this.onDateChange());
  }

  private generateTimeOptions(): void {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      const hh = h.toString().padStart(2, '0');
      options.push(`${hh}:00`);
      options.push(`${hh}:30`);
    }
    this.timeOptions = options;
  }

  onDateChange(): void {
    const selectedDate = this.form.get('date')?.value;
    if (!selectedDate || this.openingHours.length === 0) {
      this.generateTimeOptions();
      this.dayClosed = false;
      return;
    }

    const dateObj = new Date(selectedDate + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    const schedule = this.openingHours.find(h => h.day_of_week === dayOfWeek);

    if (!schedule || !schedule.is_open) {
      this.timeOptions = [];
      this.dayClosed = true;
      this.form.get('time')?.setValue('');
      return;
    }

    this.dayClosed = false;
    const open = schedule.open_time.substring(0, 5);
    const close = schedule.close_time.substring(0, 5);
    const serviceDuration = this.getSelectedServiceDuration();
    const openMinutes = this.toMinutes(open);
    const closeMinutes = this.toMinutes(close);
    const baseOptions: string[] = [];

    for (let h = 0; h < 24; h++) {
      const hh = h.toString().padStart(2, '0');
      baseOptions.push(`${hh}:00`);
      baseOptions.push(`${hh}:30`);
    }

    this.timeOptions = baseOptions.filter((time) => {
      const startMinutes = this.toMinutes(time);
      const endMinutes = startMinutes + serviceDuration;
      return startMinutes >= openMinutes && endMinutes <= closeMinutes;
    });

    const currentTime = this.form.get('time')?.value;
    if (currentTime && !this.timeOptions.includes(currentTime)) {
      this.form.get('time')?.setValue('');
    }
  }

  async loadInitialData(): Promise<void> {
    const business = this.businessService.currentBusiness();
    if (!business) {
      this.errorMessage = 'No hay un negocio seleccionado.';
      this.loadingData = false;
      return;
    }

    try {
      let query = this.supabase.client
        .from('services')
        .select('id, name, duration_minutes, price, is_active')
        .eq('business_id', business.id)
        .order('name');

      if (!this.isEditing) query = query.eq('is_active', true);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      this.services = (data ?? []).map((service: any) => ({
        id: service.id,
        name: service.name,
        duration_minutes: Number(service.duration_minutes),
        price: Number(service.price ?? 0),
      }));

      this.loadOpeningHours();

      if (this.isEditing && this.appointmentId) {
        await this.loadAppointment(this.appointmentId);
      } else {
        this.loadingData = false;
      }
    } catch (error: any) {
      this.errorMessage = error?.message ?? 'No se pudieron cargar los servicios.';
      this.loadingData = false;
    }
  }

  private loadOpeningHours(): void {
    this.businessService.getOpeningHours().subscribe({
      next: (res) => {
        this.openingHours = res.data || [];
        if (this.form.get('date')?.value) this.onDateChange();
      },
    });
  }

  async loadAppointment(id: number): Promise<void> {
    try {
      const apt = await this.appointmentsService.find(id);
      const dateObj = new Date(apt.scheduled_at);
      const dateStr = dateObj.toLocaleDateString('en-CA');
      const timeStr = dateObj.toTimeString().substring(0, 5);

      this.form.patchValue({
        client_name: apt.client_name,
        client_email: apt.client_email,
        client_phone: apt.client_phone ? apt.client_phone.replace(/^\+?569/, '') : '',
        service_id: apt.service_id,
        date: dateStr,
        time: timeStr,
        notes: apt.notes,
        status: apt.status,
      });

      this.loadingData = false;
    } catch {
      this.errorMessage = 'No se encontro la cita solicitada.';
      this.loadingData = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const payload = {
      client_name: this.form.value.client_name,
      client_email: this.form.value.client_email || null,
      client_phone: '+569' + this.form.value.client_phone,
      service_id: Number(this.form.value.service_id),
      scheduled_at: new Date(`${this.form.value.date}T${this.form.value.time}:00`).toISOString(),
      status: this.form.value.status as AppointmentStatus,
      notes: this.form.value.notes || null,
    };

    try {
      if (this.isEditing && this.appointmentId) {
        await this.appointmentsService.update(this.appointmentId, payload);
      } else {
        await this.appointmentsService.create(payload);
      }

      this.router.navigate(['/app/citas']);
    } catch (error: any) {
      this.errorMessage = error?.message || 'Ocurrio un error al guardar la cita.';
    } finally {
      this.saving = false;
    }
  }

  private getSelectedServiceDuration(): number {
    const serviceId = Number(this.form.get('service_id')?.value);
    const service = this.services.find((item) => item.id === serviceId);
    return service?.duration_minutes ?? 30;
  }

  private toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return (h * 60) + m;
  }
}
