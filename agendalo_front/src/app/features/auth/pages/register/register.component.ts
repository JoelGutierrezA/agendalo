import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { PublicFooterComponent } from '../../../../shared/components/public-footer/public-footer.component';

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
        <div class="w-full max-w-md py-10">
          <div class="text-center mb-8">
            <div class="flex justify-center h-12 mb-4">
              <img src="assets/Skedia%20Fondo%20Blanco.png" alt="Skedia" class="h-full w-auto object-contain">
            </div>
            <h1 class="text-2xl font-bold text-text-primary">Solicita tu acceso</h1>
            <p class="text-text-secondary mt-1">
              Crea tu cuenta y un administrador revisara tu solicitud.
            </p>
          </div>

          @if (submitted) {
            <section class="card p-6 text-center">
              <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
                <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-text-primary">Solicitud enviada</h2>
              <p class="mt-3 text-sm leading-6 text-text-secondary">
                Tu cuenta esta pendiente de aprobacion. Podras ingresar a Skedia una vez que tu solicitud sea aprobada.
              </p>
              <a routerLink="/login" class="btn-primary mt-6 w-full justify-center py-2.5">
                Ir a iniciar sesion
              </a>
            </section>
          } @else {
            <section class="card p-5">
              <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
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
                  @if (loading) {
                    Enviando solicitud...
                  } @else {
                    Solicitar acceso
                  }
                </button>
              </form>

              <p class="mt-4 text-center text-sm text-text-secondary">
                Ya tienes cuenta?
                <a routerLink="/login" class="text-primary font-medium hover:underline">Inicia sesion</a>
              </p>
            </section>
          }
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
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue() as {
      name: string;
      email: string;
      password: string;
    };

    this.loading = true;

    this.authService.registerPending({
      name,
      email,
      password,
      password_confirmation: password,
    }).subscribe({
      next: () => {
        this.submitted = true;
        this.toastService.success('Solicitud enviada', 7000);
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
