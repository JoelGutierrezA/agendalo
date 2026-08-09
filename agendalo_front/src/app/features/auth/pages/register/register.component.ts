import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-light via-white to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
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
              <input type="text" formControlName="name" class="form-input" [class.border-rose-400]="form.get('name')?.invalid && form.get('name')?.touched" placeholder="Tu nombre" autocomplete="name" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="form-error">El nombre es requerido</p>
              }
            </div>

            <div>
              <label class="form-label">Correo electrónico</label>
              <input type="email" formControlName="email" class="form-input" [class.border-rose-400]="form.get('email')?.invalid && form.get('email')?.touched" placeholder="tu&#64;correo.com" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="form-error">Ingresa un correo válido</p>
              }
            </div>

            <div>
              <label class="form-label">Contraseña</label>
              <input type="password" formControlName="password" class="form-input" [class.border-rose-400]="form.get('password')?.invalid && form.get('password')?.touched" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="form-error">La contraseña debe tener al menos 8 caracteres</p>
              }
            </div>

            <div>
              <label class="form-label">Confirmar contraseña</label>
              <input type="password" formControlName="password_confirmation" class="form-input" placeholder="Repite tu contraseña" autocomplete="new-password" />
            </div>


            <button type="submit" class="btn-primary w-full justify-center py-2.5" [disabled]="loading">
              @if (loading) { <span>⏳</span> Creando cuenta... } @else { Crear cuenta }
            </button>
          </form>

          <p class="mt-4 text-center text-sm text-text-secondary">
            ¿Ya tienes cuenta? <a routerLink="/login" class="text-primary font-medium hover:underline">Inicia sesión</a>
          </p>
        </div>
      </div>
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
      next: (res: any) => {
        this.toastService.success(`¡Cuenta creada con éxito, ${this.form.value.name}!`);
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
