import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

interface BusinessPublic {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
}

interface ServicePublic {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
}

@Component({
  selector: 'app-booking-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto py-8 px-4">
      @if (loadingBusiness) {
        <div class="flex justify-center py-20">
          <span class="text-text-secondary animate-pulse">Cargando información del negocio...</span>
        </div>
      } @else if (errorBusiness) {
        <div class="card text-center py-16">
          <span class="text-5xl text-gray-300">🏪</span>
          <h2 class="text-xl font-bold text-text-primary mt-4">Negocio no encontrado</h2>
          <p class="text-text-secondary mt-2">El enlace parece ser inválido o el negocio no está activo.</p>
        </div>
      } @else if (business) {
        
        <!-- Header del Negocio -->
        <div class="bg-white rounded-2xl shadow-sm border border-border p-6 sm:p-8 mb-6 text-center">
          <div class="w-20 h-20 bg-primary-light text-primary rounded-full flex items-center justify-center text-3xl mx-auto mb-4 font-bold overflow-hidden shadow-inner">
            {{ business.name.charAt(0).toUpperCase() }}
          </div>
          <h1 class="text-2xl font-bold text-text-primary">{{ business.name }}</h1>
          @if (business.description) {
            <p class="text-text-secondary mt-2 max-w-lg mx-auto">{{ business.description }}</p>
          }
          
          <div class="flex flex-wrap justify-center gap-4 mt-4 text-sm text-text-secondary">
            @if (business.address) { <span class="flex items-center gap-1">📍 {{ business.address }}</span> }
            @if (business.phone) { <span class="flex items-center gap-1">📞 {{ business.phone }}</span> }
          </div>
        </div>

        <!-- Flujo de reserva (Step Wizard) -->
        <div class="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          
          <!-- Stepper header -->
          <div class="flex border-b border-border bg-gray-50/50">
            <div class="flex-1 text-center py-3 text-sm font-medium transition-colors"
                 [class.text-primary]="step >= 1" [class.border-b-2]="step === 1" [class.border-primary]="step === 1"
                 [class.text-text-secondary]="step < 1">
              1. Servicio
            </div>
            <div class="flex-1 text-center py-3 text-sm font-medium transition-colors border-l border-border"
                 [class.text-primary]="step >= 2" [class.border-b-2]="step === 2" [class.border-primary]="step === 2"
                 [class.text-text-secondary]="step < 2">
              2. Fecha y Hora
            </div>
            <div class="flex-1 text-center py-3 text-sm font-medium transition-colors border-l border-border"
                 [class.text-primary]="step >= 3" [class.border-b-2]="step === 3" [class.border-primary]="step === 3"
                 [class.text-text-secondary]="step < 3">
              3. Tus Datos
            </div>
          </div>

          <div class="p-6 sm:p-8">
            <!-- Paso 1: Servicios -->
            @if (step === 1) {
              <h2 class="text-xl font-bold text-text-primary mb-4">Selecciona un servicio</h2>
              
              @if (loadingServices) {
                <div class="text-center py-8 text-text-secondary animate-pulse">Cargando servicios disponibles...</div>
              } @else if (services.length === 0) {
                <div class="text-center py-8">
                  <p class="text-text-primary font-medium">Este negocio aún no tiene servicios disponibles.</p>
                </div>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  @for (service of services; track service.id) {
                    <div 
                      (click)="selectService(service)"
                      class="border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
                      [class]="selectedService?.id === service.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border hover:border-primary-light'">
                      
                      <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-text-primary">{{ service.name }}</h3>
                        <span class="font-semibold text-primary text-sm whitespace-nowrap ml-2">\${{ service.price | number:'1.0-0' }}</span>
                      </div>
                      
                      @if (service.description) {
                        <p class="text-sm text-text-secondary line-clamp-2 mb-3">{{ service.description }}</p>
                      }
                      
                      <div class="flex items-center text-xs text-text-secondary font-medium">
                        ⏱️ {{ service.duration_minutes }} minutos
                      </div>
                    </div>
                  }
                </div>

                <div class="mt-8 flex justify-end">
                  <button class="btn-primary" [disabled]="!selectedService" (click)="goToStep2()">
                    Continuar →
                  </button>
                </div>
              }
            }

            <!-- Paso 2: Fecha y Hora -->
            @if (step === 2) {
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-text-primary">Elige el momento ideal</h2>
                <button (click)="step = 1" class="text-sm text-primary hover:underline">Volver a servicios</button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Selector de fecha -->
                <div>
                  <label class="font-medium text-text-primary block mb-2">Fecha</label>
                  <input type="date" 
                         [min]="minDate" 
                         [(ngModel)]="selectedDate" 
                         (change)="loadAvailability()" 
                         class="form-input w-full text-lg py-3 cursor-pointer" />
                         
                  <div class="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <p class="text-sm font-medium text-text-primary mb-1">Servicio elegido:</p>
                    <p class="text-text-secondary text-sm">{{ selectedService?.name }} (⏱️ {{ selectedService?.duration_minutes }} min)</p>
                  </div>
                </div>

                <!-- Selector de hora -->
                <div>
                  <label class="font-medium text-text-primary block mb-2">Horarios disponibles</label>
                  
                  @if (loadingAvailability) {
                    <div class="py-8 text-center text-text-secondary animate-pulse text-sm">
                      Buscando horarios...
                    </div>
                  } @else if (!selectedDate) {
                    <div class="py-8 text-center text-text-secondary text-sm border-2 border-dashed border-gray-200 rounded-xl">
                      Selecciona una fecha primero
                    </div>
                  } @else if (availableSlots.length === 0) {
                    <div class="py-8 text-center border-2 border-dashed border-red-100 bg-red-50 rounded-xl">
                      <p class="text-red-600 font-medium text-sm">No hay horarios disponibles para este día.</p>
                      <p class="text-red-500 text-xs mt-1">Intenta con otra fecha.</p>
                    </div>
                  } @else {
                    <div class="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                      @for (slot of availableSlots; track slot) {
                        <button 
                          (click)="selectedTime = slot"
                          class="py-2.5 text-center rounded-lg border text-sm font-medium transition-colors"
                          [class]="selectedTime === slot 
                            ? 'bg-primary border-primary text-white shadow-md' 
                            : 'bg-white border-border text-text-primary hover:border-primary-light hover:text-primary'">
                          {{ slot }}
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="mt-8 flex justify-between items-center pt-6 border-t border-border">
                <p class="text-sm text-text-secondary">
                  @if (selectedDate && selectedTime) {
                    Reservando el <strong class="text-text-primary">{{ formatDate(selectedDate) }}</strong> a las <strong class="text-text-primary">{{ selectedTime }}</strong>
                  }
                </p>
                <button class="btn-primary" [disabled]="!selectedDate || !selectedTime" (click)="goToStep3()">
                  Confirmar horario →
                </button>
              </div>
            }

            <!-- Paso 3: Datos del cliente -->
            @if (step === 3) {
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-xl font-bold text-text-primary">Tus datos</h2>
                  <p class="text-sm text-text-secondary mt-1">Para confirmar la reserva del <strong>{{ formatDate(selectedDate) }} a las {{ selectedTime }}</strong></p>
                </div>
                <button (click)="step = 2" class="text-sm text-primary hover:underline">Cambiar horario</button>
              </div>

              <form [formGroup]="bookingForm" (ngSubmit)="submitBooking()" class="space-y-4">
                <div>
                  <label class="form-label">Nombre completo *</label>
                  <input type="text" formControlName="client_name" class="form-input" placeholder="Ej: María González" />
                  @if (f['client_name'].invalid && f['client_name'].touched) {
                    <p class="form-error">Tu nombre es obligatorio</p>
                  }
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Correo electrónico *</label>
                    <input type="email" formControlName="client_email" class="form-input" placeholder="ejemplo@correo.com" />
                    @if (f['client_email'].invalid && f['client_email'].touched) {
                      <p class="form-error">Ingresa un correo válido</p>
                    }
                  </div>
                  <div>
                    <label class="form-label">Teléfono *</label>
                    <div class="input-group">
                      <span class="input-prefix">+56 9</span>
                      <input type="tel" formControlName="client_phone" class="form-input" placeholder="1234 5678" maxlength="8" />
                    </div>
                    @if (f['client_phone'].invalid && f['client_phone'].touched) {
                      <p class="form-error">Ingresa los 8 dígitos</p>
                    }
                  </div>
                </div>

                <div>
                  <label class="form-label">¿Algún comentario adicional? (Opcional)</label>
                  <textarea formControlName="notes" class="form-input" rows="2" placeholder="Si necesitas aclarar algo antes de la cita..."></textarea>
                </div>

                @if (bookingError) {
                  <div class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm mt-4 text-center">
                    {{ bookingError }}
                  </div>
                }

                <div class="mt-8 pt-6 border-t border-border">
                  <button type="submit" class="btn-primary w-full py-3 text-lg" [disabled]="bookingSubmitting">
                    @if (bookingSubmitting) { 
                      ⏳ Procesando reserva... 
                    } @else { 
                      Confirmar Reserva 
                    }
                  </button>
                  <p class="text-center text-xs text-text-disabled mt-4">
                    Al confirmar, aceptas las políticas de cancelación del negocio.
                  </p>
                </div>
              </form>
            }
          </div>
        </div>

      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
  `]
})
export class BookingPageComponent implements OnInit {
  slug = '';
  step = 1;

  business: BusinessPublic | null = null;
  loadingBusiness = true;
  errorBusiness = false;

  services: ServicePublic[] = [];
  loadingServices = false;
  selectedService: ServicePublic | null = null;

  minDate = '';
  selectedDate = '';
  selectedTime = '';
  availableSlots: string[] = [];
  loadingAvailability = false;

  bookingForm: FormGroup;
  bookingSubmitting = false;
  bookingError = '';

  get f() { return this.bookingForm.controls; }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.bookingForm = this.fb.group({
      client_name: ['', Validators.required],
      client_email: ['', [Validators.required, Validators.email]],
      client_phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      notes: ['']
    });

    // Fijar la fecha mínima a hoy para el input type="date"
    const today = new Date();
    // Ajustar offset timezone para no tener desfase a la fecha local
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - (offset*60*1000))
    this.minDate = localDate.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.slug = this.route.snapshot.paramMap.get('slug') || '';
    if (this.slug) {
      this.loadBusinessInfo();
    } else {
      this.errorBusiness = true;
      this.loadingBusiness = false;
    }
  }

  loadBusinessInfo(): void {
    this.http.get<{ data: BusinessPublic }>(`${environment.apiUrl}/public/business/${this.slug}`).subscribe({
      next: (res) => {
        this.business = res.data;
        this.loadingBusiness = false;
        this.loadServices();
      },
      error: () => {
        this.errorBusiness = true;
        this.loadingBusiness = false;
      }
    });
  }

  loadServices(): void {
    this.loadingServices = true;
    this.http.get<{ data: ServicePublic[] }>(`${environment.apiUrl}/public/business/${this.slug}/services`).subscribe({
      next: (res) => {
        this.services = res.data;
        this.loadingServices = false;
      },
      error: () => {
        this.loadingServices = false;
      }
    });
  }

  selectService(service: ServicePublic): void {
    this.selectedService = service;
    // Resetear fecha/hora si cambia de servicio
    this.selectedDate = '';
    this.selectedTime = '';
    this.availableSlots = [];
  }

  goToStep2(): void {
    if (this.selectedService) {
      this.step = 2;
    }
  }

  loadAvailability(): void {
    if (!this.selectedDate || !this.selectedService) return;
    
    this.selectedTime = '';
    this.loadingAvailability = true;
    this.availableSlots = [];

    this.http.get<{ data: string[] }>(`${environment.apiUrl}/public/business/${this.slug}/availability`, {
      params: { 
        service_id: this.selectedService.id.toString(),
        date: this.selectedDate
      }
    }).subscribe({
      next: (res) => {
        // Retornar array directo de strings (ej: ['09:00', '09:30'])
        this.availableSlots = res.data || [];
        this.loadingAvailability = false;
      },
      error: () => {
        this.availableSlots = [];
        this.loadingAvailability = false;
      }
    });
  }

  goToStep3(): void {
    if (this.selectedDate && this.selectedTime) {
      this.step = 3;
    }
  }

  submitBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }

    this.bookingSubmitting = true;
    this.bookingError = '';

    const payload = {
      ...this.bookingForm.value,
      client_phone: '+569' + this.bookingForm.value.client_phone,
      service_id: this.selectedService!.id,
      date: this.selectedDate,
      time: this.selectedTime
    };

    this.http.post<{ data: { id: number } }>(`${environment.apiUrl}/public/business/${this.slug}/book`, payload).subscribe({
      next: (res) => {
        this.bookingSubmitting = false;
        // Redirigir a la página de confirmación pasándo el ID por query param
        this.router.navigate(['/negocio', this.slug, 'confirmacion'], { 
          queryParams: { appointment: res.data.id } 
        });
      },
      error: (err) => {
        this.bookingError = err.error?.message || 'Hubo un problema procesando tu reserva. Por favor intenta de nuevo.';
        this.bookingSubmitting = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const part = dateStr.split('-');
    const date = new Date(+part[0], +part[1] - 1, +part[2]);
    return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}
