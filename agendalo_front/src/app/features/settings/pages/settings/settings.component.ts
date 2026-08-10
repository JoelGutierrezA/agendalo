import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BusinessSettings } from '../../../../models/auth.models';
import { BusinessService } from '../../services/business.service';
import { GoogleCalendarService, GoogleCalendarStatus } from '../../services/google-calendar.service';

/** Página de configuración del negocio con tabs */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div>
      <div class="page-header">
        <div class="flex items-center gap-3">
          <img src="assets/Interfaz/Configuraci%C3%B3n.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
          <h1 class="page-title">Configuración</h1>
        </div>
        <button
          class="btn-primary"
          [disabled]="loading || logoUploading || saveSuccess"
          (click)="onSave()"
        >
          @if (loading) { Guardando... }
          @else if (saveSuccess) { Guardado }
          @else { Guardar cambios }
        </button>
      </div>

      @if (saveError) {
        <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {{ saveError }}
        </div>
      }

      <div class="flex gap-1 mb-5 border-b border-border">
        @for (tab of filteredTabs; track tab.id) {
          <button
            (click)="activeTab = tab.id"
            class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
            [class]="activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-text-primary'"
          >
            <span>{{ tab.icon }}</span> {{ tab.label }}
          </button>
        }
      </div>

      <!-- Tab: Datos del negocio -->
      @if (activeTab === 'business') {
        <div class="card">
          <h3 class="mb-4">Datos del negocio</h3>
          @if (dataLoading) {
            <p class="text-text-secondary text-sm">Cargando datos...</p>
          } @else {
            <form [formGroup]="businessForm" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border bg-gray-50/50">
                <div class="w-20 h-20 rounded-2xl bg-primary-light text-primary flex items-center justify-center text-2xl font-bold overflow-hidden flex-shrink-0">
                  @if (logoPreviewUrl) {
                    <img [src]="logoPreviewUrl" alt="Icono del negocio" class="w-full h-full object-cover">
                  } @else {
                    {{ (businessForm.value.name || 'S').charAt(0).toUpperCase() }}
                  }
                </div>

                <div class="flex-1">
                  <label class="form-label">Icono del negocio</label>
                  <p class="text-xs text-text-secondary mb-3">Usa una imagen cuadrada en PNG, JPG o WebP de máximo 1 MB. Se mostrará en tu página de reservas.</p>
                  <div class="flex flex-wrap gap-2">
                    <input #logoInput type="file" class="hidden" accept="image/png,image/jpeg,image/webp" (change)="onLogoSelected($event)" />
                    <button type="button" class="btn-secondary" (click)="logoInput.click()" [disabled]="logoUploading">
                      {{ logoUploading ? 'Subiendo...' : 'Subir imagen' }}
                    </button>
                    @if (logoPreviewUrl) {
                      <button type="button" class="btn-secondary" (click)="removeLogo()" [disabled]="logoUploading">
                        Quitar imagen
                      </button>
                    }
                  </div>
                </div>
              </div>

              <div class="sm:col-span-2">
                <label class="form-label">Nombre del negocio *</label>
                <input type="text" formControlName="name" class="form-input" placeholder="Nombre comercial" />
                @if (f['name'].invalid && f['name'].touched) {
                  <p class="form-error">El nombre es requerido</p>
                }
              </div>
              <div>
                <label class="form-label">Teléfono *</label>
                <div class="input-group">
                  <span class="input-prefix">+56 9</span>
                  <input type="tel" formControlName="phone" class="form-input" placeholder="1234 5678" maxlength="8" />
                </div>
                @if (f['phone'].invalid && f['phone'].touched) {
                  <p class="form-error">Ingresa los 8 dígitos</p>
                }
              </div>
              <div>
                <label class="form-label">Email del negocio</label>
                <input type="email" formControlName="email" class="form-input" placeholder="negocio&#64;correo.com" />
                @if (f['email'].invalid && f['email'].touched) {
                  <p class="form-error">Ingresa un email válido</p>
                }
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">Descripción</label>
                <textarea formControlName="description" class="form-input" rows="3" placeholder="Describe tu negocio..."></textarea>
              </div>
              <div class="sm:col-span-2">
                <label class="form-label">Dirección</label>
                <input type="text" formControlName="address" class="form-input" placeholder="Av. Principal 123, Ciudad" />
              </div>
              <div>
                <label class="form-label">Ciudad</label>
                <input type="text" formControlName="city" class="form-input" placeholder="Ciudad" />
              </div>
              <div>
                <label class="form-label">País</label>
                <input type="text" formControlName="country" class="form-input" placeholder="Chile" />
              </div>
            </form>
          }
        </div>
      }

      <!-- Tab: Horarios -->
      @if (activeTab === 'hours') {
        <div class="card">
          <h3 class="mb-4">Horario de atención</h3>
          @for (day of days; track day.name) {
            <div class="flex items-center gap-4 py-3 border-b border-border last:border-0">
              <div class="w-24 flex-shrink-0">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="day.open" [ngModelOptions]="{standalone: true}" class="w-4 h-4 accent-primary" />
                  <span class="text-sm font-medium">{{ day.name }}</span>
                </label>
              </div>
              @if (day.open) {
                <select class="form-input w-32" [(ngModel)]="day.open_time" [ngModelOptions]="{standalone: true}">
                  @for (time of timeOptions; track time) {
                    <option [value]="time">{{ time }}</option>
                  }
                </select>
                <span class="text-text-secondary text-sm">hasta</span>
                <select class="form-input w-32" [(ngModel)]="day.close_time" [ngModelOptions]="{standalone: true}">
                  @for (time of timeOptions; track time) {
                    <option [value]="time">{{ time }}</option>
                  }
                </select>
              } @else {
                <span class="text-text-secondary text-sm italic">Cerrado</span>
              }
            </div>
          }
          <p class="mt-4 text-xs text-text-secondary">Los horarios se guardarán automáticamente en tu perfil de negocio.</p>
        </div>
      }

      <!-- Tab: Reservas -->
      @if (activeTab === 'booking') {
        <div class="card">
          <h3 class="mb-4">Configuración de reservas</h3>
          <div class="space-y-4">
            <div>
              <label class="form-label">Días disponibles para reservar con anticipación</label>
              <input type="number" class="form-input w-32" value="30" min="1" max="365" />
              <p class="text-xs text-text-secondary mt-1">Los clientes podrán reservar hasta X días en el futuro</p>
            </div>
            <div>
              <label class="form-label">Horas mínimas de anticipación</label>
              <input type="number" class="form-input w-32" value="1" min="0" />
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" class="w-4 h-4 accent-primary" id="require-confirmation" />
              <label for="require-confirmation" class="text-sm text-text-primary cursor-pointer">
                Requiero confirmar reservas manualmente antes de que queden activas
              </label>
            </div>
          </div>
          <p class="mt-4 text-xs text-text-secondary">Configuración de reservas disponible próximamente</p>
        </div>
      }

      <!-- Tab: Google Calendar -->
      @if (activeTab === 'calendar') {
        <div class="card">
          <h3 class="mb-2">Google Calendar</h3>
          <p class="text-text-secondary text-sm mb-5">Sincroniza tus citas automáticamente con tu Google Calendar</p>

          @if (calendarLoading) {
            <p class="text-text-secondary text-sm">Consultando estado de integración...</p>
          } @else {
            <div
              class="p-5 rounded-xl border flex items-start gap-4"
              [ngClass]="googleStatus?.connected ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'"
            >
              <span class="text-3xl flex-shrink-0">📅</span>
              <div class="flex-1">
                @if (googleStatus?.connected) {
                  <p class="font-medium text-emerald-900">Conectado</p>
                  <p class="text-emerald-700 text-sm mt-1">
                    Cuenta: <strong>{{ googleStatus?.google_email || 'Google Account' }}</strong>
                  </p>
                } @else {
                  <p class="font-medium text-amber-900">No conectado</p>
                  <p class="text-amber-700 text-sm mt-1">Conecta tu cuenta para sincronizar citas automáticamente.</p>
                }
              </div>
            </div>

            <div class="mt-5 flex flex-wrap items-center gap-3">
              @if (googleStatus?.connected) {
                <button class="btn-secondary" (click)="disconnectGoogle()" [disabled]="calendarLoading">
                  Desconectar Google Calendar
                </button>
              } @else {
                <button class="btn-primary" (click)="connectGoogle()" [disabled]="calendarLoading">
                  Conectar con Google Calendar
                </button>
              }
            </div>

            <div class="mt-6 border-t border-border pt-5">
              <label class="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  class="w-4 h-4 mt-0.5 accent-primary"
                  [(ngModel)]="settingsData.send_client_calendar_invite"
                  [ngModelOptions]="{ standalone: true }"
                />
                <span>
                  <span class="block text-sm font-medium text-text-primary">Enviar invitación al cliente (ON/OFF)</span>
                  <span class="block text-xs text-text-secondary mt-1">
                    Si está activado, se enviará invitación de Google Calendar al correo del cliente cuando se cree o actualice una cita.
                  </span>
                </span>
              </label>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  businessForm: FormGroup;
  loading      = false;
  dataLoading  = true;
  saveSuccess  = false;
  saveError    = '';
  activeTab    = 'business';
  logoPreviewUrl = '';
  logoUploading = false;
  calendarLoading = false;
  googleStatus: GoogleCalendarStatus | null = null;
  settingsData: BusinessSettings = {
    booking_advance_days: 30,
    min_booking_notice_hours: 1,
    allow_public_booking: true,
    booking_confirmation_required: false,
    send_client_calendar_invite: true,
    time_zone: 'America/Santiago',
    currency: 'CLP',
  };

  tabs = [
    { id: 'business', label: 'Datos del negocio', icon: '🏪' },
    { id: 'hours',    label: 'Horarios',           icon: '🕐' },
    { id: 'booking',  label: 'Reservas',            icon: '⚙️' },
    { id: 'calendar', label: 'Google Calendar',     icon: '📅' },
  ];

  get filteredTabs() {
    const userData = this.authService.currentUser();
    if (userData?.role === 'admin_platform') {
      return this.tabs.filter(t => t.id === 'business');
    }
    return this.tabs;
  }

  days = [
    { name: 'Lunes',     day: 1, open: true,  open_time: '09:00', close_time: '18:00' },
    { name: 'Martes',    day: 2, open: true,  open_time: '09:00', close_time: '18:00' },
    { name: 'Miércoles', day: 3, open: true,  open_time: '09:00', close_time: '18:00' },
    { name: 'Jueves',    day: 4, open: true,  open_time: '09:00', close_time: '18:00' },
    { name: 'Viernes',   day: 5, open: true,  open_time: '09:00', close_time: '18:00' },
    { name: 'Sábado',    day: 6, open: true,  open_time: '09:00', close_time: '14:00' },
    { name: 'Domingo',   day: 0, open: false, open_time: '',       close_time: '' },
  ];

  /** Opciones de tiempo cada 30 minutos */
  timeOptions: string[] = [];

  get f() { return this.businessForm.controls; }

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private googleCalendarService: GoogleCalendarService,
    private toastService: ToastService
  ) {
    this.generateTimeOptions();
    this.businessForm = this.fb.group({
      name:        ['', [Validators.required, Validators.maxLength(255)]],
      phone:        ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      email:       ['', [Validators.email]],
      description: [''],
      address:     [''],
      city:        [''],
      country:     [''],
      logo_url:    [''],
    });
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

  ngOnInit(): void {
    const queryTab = this.route.snapshot.queryParamMap.get('tab');
    if (queryTab && this.tabs.some(t => t.id === queryTab)) {
      this.activeTab = queryTab;
    }

    this.loadBusinessData();
    this.loadOpeningHours();
    this.loadSettings();
    this.loadGoogleStatus();

    const googleResult = this.route.snapshot.queryParamMap.get('google');
    if (googleResult === 'connected') {
      this.toastService.success('Google Calendar conectado correctamente');
    } else if (googleResult === 'error') {
      this.toastService.error('No se pudo completar la conexión con Google Calendar');
    }
  }

  private loadSettings(): void {
    this.businessService.getSettings().subscribe({
      next: (res) => {
        if (res.data) {
          this.settingsData = {
            ...this.settingsData,
            ...res.data,
          };
        }
      }
    });
  }

  private loadGoogleStatus(): void {
    if (this.authService.currentUser()?.role === 'admin_platform') {
      return;
    }

    this.calendarLoading = true;
    this.googleCalendarService.getStatus().subscribe({
      next: (status) => {
        this.googleStatus = status;
        this.calendarLoading = false;
      },
      error: () => {
        this.calendarLoading = false;
      }
    });
  }

  connectGoogle(): void {
    this.calendarLoading = true;
    this.googleCalendarService.getAuthUrl().subscribe({
      next: (authUrl) => {
        window.location.href = authUrl;
      },
      error: () => {
        this.calendarLoading = false;
      }
    });
  }

  disconnectGoogle(): void {
    this.calendarLoading = true;
    this.googleCalendarService.disconnect().subscribe({
      next: () => {
        this.toastService.success('Google Calendar desconectado');
        this.loadGoogleStatus();
      },
      error: () => {
        this.calendarLoading = false;
      }
    });
  }

  private loadBusinessData(): void {
    this.businessService.getBusiness().subscribe({
      next: (res) => {
        if (res.data) {
          const b = res.data;
          this.businessForm.patchValue({
            name:        b.name        ?? '',
            phone:       b.phone ? b.phone.replace('+569', '') : '',
            email:       b.email       ?? '',
            description: b.description ?? '',
            address:     b.address     ?? '',
            city:        b.city        ?? '',
            country:     b.country     ?? '',
            logo_url:    b.logo_url    ?? '',
          });
          this.logoPreviewUrl = b.logo_url ?? '';
        }
        this.dataLoading = false;
      },
      error: () => { this.dataLoading = false; }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.saveError = 'No se puede subir esa imagen. El formato debe ser PNG, JPG o WebP.';
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      this.saveError = 'No se puede subir esa imagen. El icono no puede pesar más de 1 MB.';
      return;
    }

    this.logoUploading = true;
    this.saveError = '';

    this.businessService.uploadBusinessLogo(file).subscribe({
      next: (res) => {
        this.logoPreviewUrl = res.data;
        this.businessForm.patchValue({ logo_url: res.data });
        this.logoUploading = false;
        this.toastService.success('Icono del negocio actualizado');
      },
      error: (err) => {
        this.saveError = err?.message ?? 'No se pudo subir el icono del negocio.';
        this.logoUploading = false;
      }
    });
  }

  removeLogo(): void {
    this.logoPreviewUrl = '';
    this.businessForm.patchValue({ logo_url: '' });
  }

  private loadOpeningHours(): void {
    this.businessService.getOpeningHours().subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          // Mapeamos los días del servidor a nuestro arreglo local
          // El servidor devuelve un array de 7 objetos con day_of_week, is_open, open_time, close_time
          this.days.forEach(localDay => {
            const serverDay = res.data!.find(d => d.day_of_week === localDay.day);
            if (serverDay) {
              localDay.open = serverDay.is_open;
              // El servidor devuelve H:i:s, lo cortamos a H:i para el input type="time"
              localDay.open_time = serverDay.open_time ? serverDay.open_time.substring(0, 5) : '09:00';
              localDay.close_time = serverDay.close_time ? serverDay.close_time.substring(0, 5) : '18:00';
            }
          });
        }
      }
    });
  }

  onSave(): void {
    if (this.activeTab === 'business') {
      this.saveBusinessInfo();
    } else if (this.activeTab === 'hours') {
      this.saveHours();
    } else if (this.activeTab === 'calendar') {
      this.saveCalendarSettings();
    }
  }

  private saveCalendarSettings(): void {
    this.loading = true;
    this.saveError = '';
    this.saveSuccess = false;

    this.businessService.updateSettings({
      send_client_calendar_invite: this.settingsData.send_client_calendar_invite,
    }).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.loading = false;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: (err) => {
        this.saveError = err?.error?.message ?? 'No se pudo guardar la configuración de invitación al cliente.';
        this.loading = false;
      }
    });
  }

  private saveBusinessInfo(): void {
    if (this.businessForm.invalid) {
      this.businessForm.markAllAsTouched();
      return;
    }

    this.loading     = true;
    this.saveError   = '';
    this.saveSuccess = false;

    const payload = {
      ...this.businessForm.value,
      phone: '+569' + this.businessForm.value.phone,
      logo_url: this.businessForm.value.logo_url || null,
    };

    this.businessService.updateBusiness(payload).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.loading = false;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: (err) => {
        this.saveError = err?.error?.message ?? 'No se pudo guardar. Intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  private saveHours(): void {
    this.loading = true;
    this.saveError = '';
    this.saveSuccess = false;

    // Preparamos los datos para el servidor
    const payload = this.days.map(d => ({
      day_of_week: d.day,
      is_open: d.open,
      open_time: d.open ? d.open_time : null,
      close_time: d.open ? d.close_time : null
    }));

    this.businessService.updateOpeningHours(payload).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.loading = false;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: (err) => {
        this.saveError = err?.error?.message ?? 'No se pudo guardar los horarios.';
        this.loading = false;
      }
    });
  }
}

