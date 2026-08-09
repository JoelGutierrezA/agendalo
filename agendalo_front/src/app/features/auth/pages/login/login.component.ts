import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { BusinessService } from '../../../settings/services/business.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
            <a routerLink="/registro" class="btn-primary px-4 py-2.5">Registrarse</a>
          </nav>
        </div>
      </header>

      <main class="flex-1 bg-gradient-to-br from-primary-light via-white to-blue-50 flex items-center justify-center p-4">
        <div class="w-full max-w-sm py-10">
          <div class="text-center mb-8">
            <div class="flex justify-center h-12 mb-4">
              <img src="assets/Skedia_sf.png" alt="Skedia" class="h-full w-auto">
            </div>
            <h1 class="text-2xl font-bold text-text-primary">Bienvenido a Skedia</h1>
            <p class="text-text-secondary mt-1">Inicia sesion para gestionar tu negocio</p>
          </div>

          <div class="card">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
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
                    placeholder="Minimo 8 caracteres"
                    autocomplete="current-password"
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
                  <p class="form-error">La contrasena es requerida</p>
                }
              </div>

              <button
                type="submit"
                class="btn-primary w-full justify-center py-2.5"
                [disabled]="loading"
              >
                @if (loading) {
                  Ingresando...
                } @else {
                  Iniciar sesion
                }
              </button>
            </form>

            <div class="mt-4 text-center space-y-2">
              <a routerLink="/recuperar-contrasena" class="text-sm text-primary hover:underline block">
                Olvidaste tu contrasena?
              </a>
              <p class="text-sm text-text-secondary">
                No tienes cuenta?
                <a routerLink="/registro" class="text-primary font-medium hover:underline">Registrate</a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer class="bg-white border-t border-border">
        <div class="max-w-6xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-start justify-between gap-3 text-sm text-text-secondary">
          <div class="flex flex-col items-start gap-2">
            <img src="assets/Skedia%20Fondo%20Blanco.png" alt="Skedia" class="h-9 w-auto max-w-[140px] object-contain">
            <p>Plataforma de agendamiento</p>
            <div class="flex items-center gap-2 pt-1" aria-label="Redes sociales">
              <button type="button" class="w-9 h-9 rounded-full border border-blue-100 bg-primary-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="Instagram" aria-label="Instagram">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="2"/>
                  <circle cx="17" cy="7" r="1.2" fill="currentColor"/>
                </svg>
              </button>
              <button type="button" class="w-9 h-9 rounded-full border border-blue-100 bg-primary-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="Facebook" aria-label="Facebook">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14.2 8.4V6.9c0-.7.5-1.1 1.2-1.1h1.8V3h-2.6c-2.8 0-4.2 1.6-4.2 4v1.4H8.3v3.1h2.1V21h3.8v-9.5h2.6l.5-3.1h-3.1z"/>
                </svg>
              </button>
              <button type="button" class="w-9 h-9 rounded-full border border-blue-100 bg-primary-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="WhatsApp" aria-label="WhatsApp">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5.5 19.1l1-3A7.5 7.5 0 1 1 9 18.5l-3.5.6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M9.4 8.8c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.5c.1.3.1.5-.1.7l-.4.5c.6 1.1 1.4 1.9 2.5 2.5l.5-.4c.2-.2.5-.2.7-.1l1.5.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.7-.7.3-1.7.2-2.8-.3-1.5-.7-2.8-1.8-3.7-3.2-.8-1.2-1.2-2.6-.9-3.5z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/" class="hover:text-primary">Inicio</a>
            <a routerLink="/planes" class="hover:text-primary">Planes</a>
            <a routerLink="/registro" class="hover:text-primary">Crear cuenta</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private businessService: BusinessService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        const user = res.data.user;
        this.toastService.success(`Bienvenido de nuevo, ${user.name}!`);

        if (user.role === 'admin_platform') {
          this.router.navigate(['/admin-plataforma']);
          return;
        }

        if (res.data.business) {
          this.businessService.setBusiness(res.data.business);
          this.router.navigate(['/app/dashboard']);
          return;
        }

        if (user.business_id) {
          this.businessService.getBusiness().subscribe({
            next: () => this.router.navigate(['/app/dashboard']),
            error: () => this.router.navigate(['/onboarding'])
          });
          return;
        }

        this.router.navigate(['/onboarding']);
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo iniciar sesion');
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
