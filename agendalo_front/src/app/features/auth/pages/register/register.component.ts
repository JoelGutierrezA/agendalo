import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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
        <div class="w-full max-w-sm py-10">
          <div class="text-center mb-8">
            <div class="flex justify-center h-12 mb-4">
              <img src="assets/Skedia_sf.png" alt="Skedia" class="h-full w-auto">
            </div>
            <h1 class="text-2xl font-bold text-text-primary">Crea tu cuenta</h1>
            <p class="text-text-secondary mt-1">Empieza a gestionar tu negocio gratis</p>
          </div>

          <div class="card">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="form-label">Nombre completo</label>
                <input
                  type="text"
                  formControlName="name"
                  class="form-input"
                  [class.border-rose-400]="form.get('name')?.invalid && form.get('name')?.touched"
                  placeholder="Tu nombre"
                  autocomplete="name"
                />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="form-error">El nombre es requerido</p>
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
                <input
                  type="password"
                  formControlName="password"
                  class="form-input"
                  [class.border-rose-400]="form.get('password')?.invalid && form.get('password')?.touched"
                  placeholder="Minimo 8 caracteres"
                  autocomplete="new-password"
                />
                @if (form.get('password')?.invalid && form.get('password')?.touched) {
                  <p class="form-error">La contrasena debe tener al menos 8 caracteres</p>
                }
              </div>

              <div>
                <label class="form-label">Confirmar contrasena</label>
                <input
                  type="password"
                  formControlName="password_confirmation"
                  class="form-input"
                  placeholder="Repite tu contrasena"
                  autocomplete="new-password"
                />
              </div>

              <button type="submit" class="btn-primary w-full justify-center py-2.5" [disabled]="loading">
                @if (loading) { Creando cuenta... } @else { Crear cuenta }
              </button>
            </form>

            <p class="mt-4 text-center text-sm text-text-secondary">
              Ya tienes cuenta? <a routerLink="/login" class="text-primary font-medium hover:underline">Inicia sesion</a>
            </p>
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
      password_confirmation: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.toastService.success(`Cuenta creada con exito, ${this.form.value.name}!`);
        this.router.navigate(['/onboarding']);
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo crear la cuenta');
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
