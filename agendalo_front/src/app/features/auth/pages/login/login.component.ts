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
    <div class="min-h-screen bg-gradient-to-br from-primary-light via-white to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">

        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="flex justify-center h-12 mb-4">
            <img src="assets/Skedia_sf.png" alt="Skedia" class="h-full w-auto">
          </div>
          <h1 class="text-2xl font-bold text-text-primary">Bienvenido a Skedia</h1>
          <p class="text-text-secondary mt-1">Inicia sesión para gestionar tu negocio</p>
        </div>

        <!-- Card Formulario -->
        <div class="card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div>
              <label class="form-label">Correo electrónico</label>
              <input
                type="email"
                formControlName="email"
                class="form-input"
                [class.border-rose-400]="form.get('email')?.invalid && form.get('email')?.touched"
                placeholder="tu&#64;correo.com"
                autocomplete="email"
              />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="form-error">Ingresa un correo válido</p>
              }
            </div>

            <div>
              <label class="form-label">Contraseña</label>
              <div class="relative">
                <input
                  [type]="showPassword ? 'text' : 'password'"
                  formControlName="password"
                  class="form-input pr-10"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                  title="Mostrar/Ocultar contraseña"
                >
                  <span class="text-lg">{{ showPassword ? '👁️‍🗨️' : '👁️' }}</span>
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="form-error">La contraseña es requerida</p>
              }
            </div>


            <button
              type="submit"
              class="btn-primary w-full justify-center py-2.5"
              [disabled]="loading"
            >
              @if (loading) {
                <span class="animate-spin">⏳</span> Ingresando...
              } @else {
                Iniciar sesión
              }
            </button>
          </form>

          <div class="mt-4 text-center space-y-2">
            <a routerLink="/recuperar-contrasena" class="text-sm text-primary hover:underline block">
              ¿Olvidaste tu contraseña?
            </a>
            <p class="text-sm text-text-secondary">
              ¿No tienes cuenta?
              <a routerLink="/registro" class="text-primary font-medium hover:underline">Regístrate</a>
            </p>
          </div>
        </div>

      </div>
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
        this.toastService.success(`¡Bienvenido de nuevo, ${user.name}!`);

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
