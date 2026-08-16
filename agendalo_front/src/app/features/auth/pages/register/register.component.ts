import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PublicFooterComponent } from '../../../../shared/components/public-footer/public-footer.component';

type RegisterStep = 'account' | 'payment';

interface RegisterPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PublicFooterComponent],
  template: `
    <div class="min-h-screen bg-slate-50 text-text-primary flex flex-col">
      <header class="bg-white border-b border-border">
        <div class="max-w-6xl mx-auto px-5 py-5 sm:py-6 grid grid-cols-[auto_1fr_auto] items-center gap-5">
          <a routerLink="/" class="flex items-center">
            <img src="assets/Skedia%20Fondo%20Blanco.png" alt="Skedia" class="h-11 sm:h-12 w-auto max-w-[145px] sm:max-w-[180px] object-contain">
          </a>

          <nav class="hidden sm:flex items-center justify-center gap-10 text-base font-semibold text-text-secondary">
            <a routerLink="/" class="hover:text-primary transition-colors">Inicio</a>
            <a routerLink="/planes" class="hover:text-primary transition-colors">Planes</a>
          </nav>

          <nav class="flex items-center gap-3 text-base">
            <a routerLink="/login" class="btn-secondary px-4 py-2.5">Ingresar</a>
          </nav>
        </div>
      </header>

      <main class="flex-1 bg-gradient-to-br from-primary-light via-white to-blue-50 flex items-center justify-center p-4">
        <div class="w-full max-w-3xl py-10">
          <div class="text-center mb-8">
            <div class="flex justify-center h-12 mb-4">
              <img src="assets/Skedia%20Fondo%20Blanco.png" alt="Skedia" class="h-full w-auto object-contain">
            </div>
            <h1 class="text-2xl font-bold text-text-primary">
              {{ step === 'account' ? 'Crea tu cuenta' : 'Elige tu plan' }}
            </h1>
            <p class="text-text-secondary mt-1">
              {{ step === 'account' ? 'Primero registra tus datos. La cuenta se crea despues del pago.' : 'Pago mock: al confirmar se creara tu cuenta.' }}
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-4 items-start">
            <section class="card p-5">
              <div class="flex items-center gap-3 mb-5">
                <span
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  [ngClass]="step === 'account' ? 'bg-primary text-white' : 'bg-primary-light text-primary'"
                >
                  1
                </span>
                <div>
                  <p class="font-semibold text-text-primary">Datos de acceso</p>
                  <p class="text-xs text-text-secondary">Nombre, correo y contrasena</p>
                </div>
              </div>

              <form [formGroup]="form" (ngSubmit)="continueToPayment()" class="space-y-4">
                <div>
                  <label class="form-label">Nombre</label>
                  <input
                    type="text"
                    formControlName="name"
                    class="form-input"
                    [class.border-rose-400]="form.get('name')?.invalid && form.get('name')?.touched"
                    placeholder="Tu nombre"
                    autocomplete="name"
                  />
                  @if (form.get('name')?.invalid && form.get('name')?.touched) {
                    <p class="form-error">Ingresa al menos 2 caracteres</p>
                  }
                </div>

                <div>
                  <label class="form-label">Correo electronico</label>
                  <input
                    type="email"
                    formControlName="email"
                    class="form-input"
                    [class.border-rose-400]="form.get('email')?.invalid && form.get('email')?.touched"
                    placeholder="tu&#64;correo.com"
                    autocomplete="email"
                  />
                  @if (form.get('email')?.invalid && form.get('email')?.touched) {
                    <p class="form-error">Ingresa un correo valido</p>
                  }
                </div>

                <div>
                  <label class="form-label">Contrasena</label>
                  <div class="relative">
                    <input
                      [type]="showPassword ? 'text' : 'password'"
                      formControlName="password"
                      class="form-input pr-10"
                      [class.border-rose-400]="form.get('password')?.invalid && form.get('password')?.touched"
                      placeholder="Minimo 8 caracteres"
                      autocomplete="new-password"
                    />
                    <button
                      type="button"
                      (click)="showPassword = !showPassword"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none text-sm font-medium"
                    >
                      {{ showPassword ? 'Ocultar' : 'Ver' }}
                    </button>
                  </div>
                  @if (form.get('password')?.invalid && form.get('password')?.touched) {
                    <p class="form-error">La contrasena debe tener minimo 8 caracteres</p>
                  }
                </div>

                <button
                  type="submit"
                  class="btn-primary w-full justify-center py-2.5"
                  [disabled]="loading"
                >
                  Continuar al pago
                </button>
              </form>

              <p class="mt-4 text-center text-sm text-text-secondary">
                Ya tienes cuenta?
                <a routerLink="/login" class="text-primary font-medium hover:underline">Inicia sesion</a>
              </p>
            </section>

            <section class="card p-5" [ngClass]="step === 'account' ? 'opacity-70' : ''">
              <div class="flex items-center gap-3 mb-5">
                <span
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  [ngClass]="step === 'payment' ? 'bg-primary text-white' : 'bg-slate-100 text-text-secondary'"
                >
                  2
                </span>
                <div>
                  <p class="font-semibold text-text-primary">Suscripcion</p>
                  <p class="text-xs text-text-secondary">Selecciona un plan y confirma el pago</p>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                @for (plan of plans; track plan.id) {
                  <button
                    type="button"
                    (click)="selectPlan(plan.id)"
                    class="text-left rounded-lg border p-3 transition-all bg-white"
                    [disabled]="step === 'account' || loading"
                    [ngClass]="selectedPlan === plan.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'"
                  >
                    <p class="font-semibold text-text-primary">{{ plan.name }}</p>
                    <p class="text-lg font-bold text-primary mt-1">{{ plan.price }}</p>
                    <p class="text-xs text-text-secondary mt-1">{{ plan.description }}</p>
                  </button>
                }
              </div>

              <div class="mt-5 rounded-lg border border-dashed border-primary/40 bg-primary-light/40 p-4">
                <p class="font-semibold text-text-primary">Pasarela de pago mock</p>
                <p class="text-sm text-text-secondary mt-1">
                  Por ahora no se cobrara nada. Al presionar pagar simulamos el pago aprobado y recien ahi creamos la cuenta.
                </p>

                <ul class="mt-3 space-y-2 text-sm text-text-secondary">
                  @for (feature of currentPlan.features; track feature) {
                    <li class="flex gap-2">
                      <span class="text-primary font-bold">+</span>
                      <span>{{ feature }}</span>
                    </li>
                  }
                </ul>
              </div>

              <div class="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  class="btn-secondary w-full justify-center py-2.5"
                  (click)="backToAccount()"
                  [disabled]="step === 'account' || loading"
                >
                  Volver
                </button>
                <button
                  type="button"
                  class="btn-primary w-full justify-center py-2.5"
                  (click)="payAndCreateAccount()"
                  [disabled]="step === 'account' || loading"
                >
                  @if (loading) {
                    Creando cuenta...
                  } @else {
                    Pagar y crear cuenta
                  }
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <app-public-footer></app-public-footer>
    </div>
  `,
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;
  step: RegisterStep = 'account';
  selectedPlan = 'medio';

  plans: RegisterPlan[] = [
    {
      id: 'basico',
      name: 'Basico',
      price: '$9.990',
      description: 'Para comenzar',
      features: ['Agenda online', 'Clientes y servicios', 'Panel de finanzas'],
    },
    {
      id: 'medio',
      name: 'Medio',
      price: '$19.990',
      description: 'Para negocios activos',
      features: ['Todo lo del plan Basico', 'Gestion de citas', 'Reportes principales'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$29.990',
      description: 'Para crecer',
      features: ['Todo lo del plan Medio', 'Equipo y permisos', 'Soporte prioritario'],
    },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  get currentPlan(): RegisterPlan {
    return this.plans.find(plan => plan.id === this.selectedPlan) ?? this.plans[0];
  }

  continueToPayment(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.step = 'payment';
  }

  selectPlan(planId: string): void {
    this.selectedPlan = planId;
  }

  backToAccount(): void {
    this.step = 'account';
  }

  payAndCreateAccount(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.step = 'account';
      return;
    }

    const { name, email, password } = this.form.getRawValue() as {
      name: string;
      email: string;
      password: string;
    };

    this.loading = true;

    this.authService.register({
      name,
      email,
      password,
      password_confirmation: password,
    }).subscribe({
      next: () => {
        this.toastService.success(`Pago mock aprobado. Cuenta creada en plan ${this.currentPlan.name}.`);
        this.router.navigate(['/onboarding']);
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo crear la cuenta');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
