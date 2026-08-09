import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-light via-white to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <span class="text-4xl">#</span>
          <h1 class="text-2xl font-bold text-text-primary mt-3">Nueva contrasena</h1>
          <p class="text-text-secondary mt-1">Ingresa y confirma tu nueva contrasena</p>
        </div>

        <div class="card">
          @if (success) {
            <div class="text-center py-4">
              <span class="text-4xl">OK</span>
              <p class="mt-3 text-text-primary font-medium">Contrasena restablecida</p>
              <p class="text-text-secondary text-sm mt-1">Ya puedes iniciar sesion con tu nueva contrasena.</p>
              <a routerLink="/login" class="btn-primary mt-4 inline-block text-center">Ir al login</a>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="form-label">Nueva contrasena</label>
                <input type="password" formControlName="password" class="form-input" placeholder="Minimo 8 caracteres" autocomplete="new-password" />
                @if (form.get('password')?.invalid && form.get('password')?.touched) {
                  <p class="form-error">Minimo 8 caracteres</p>
                }
              </div>
              <div>
                <label class="form-label">Confirmar contrasena</label>
                <input type="password" formControlName="password_confirmation" class="form-input" placeholder="Repite la contrasena" autocomplete="new-password" />
                @if (form.hasError('mismatch') && form.get('password_confirmation')?.touched) {
                  <p class="form-error">Las contrasenas no coinciden</p>
                }
              </div>

              @if (errorMessage) {
                <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ errorMessage }}</div>
              }

              <button type="submit" class="btn-primary w-full justify-center py-2.5" [disabled]="loading">
                @if (loading) { Restableciendo... } @else { Restablecer contrasena }
              </button>
            </form>
          }

          <p class="mt-4 text-center text-sm text-text-secondary">
            <a routerLink="/login" class="text-primary hover:underline">Volver al login</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  success = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        password_confirmation: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.errorMessage = '';
  }

  private passwordMatchValidator(group: FormGroup) {
    const pw = group.get('password')?.value;
    const cpw = group.get('password_confirmation')?.value;
    return pw === cpw ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword({
      password: this.form.value.password,
      password_confirmation: this.form.value.password_confirmation,
    }).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.message ?? err?.error?.message ?? 'No se pudo restablecer la contrasena.';
        this.loading = false;
      },
    });
  }
}
