import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-light via-white to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <span class="text-4xl">🔐</span>
          <h1 class="text-2xl font-bold text-text-primary mt-3">Recuperar contraseña</h1>
          <p class="text-text-secondary mt-1">Te enviaremos un enlace a tu correo</p>
        </div>

        <div class="card">
          @if (!sent) {
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              <div>
                <label class="form-label">Correo electrónico</label>
                <input type="email" formControlName="email" class="form-input" placeholder="tu&#64;correo.com" />
              </div>
              <button type="submit" class="btn-primary w-full justify-center py-2.5" [disabled]="loading">
                @if (loading) { Enviando... } @else { Enviar enlace }
              </button>
            </form>
          } @else {
            <div class="text-center py-4">
              <span class="text-4xl">✅</span>
              <p class="mt-3 text-text-primary font-medium">¡Correo enviado!</p>
              <p class="text-text-secondary text-sm mt-1">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
            </div>
          }

          <p class="mt-4 text-center text-sm text-text-secondary">
            <a routerLink="/login" class="text-primary hover:underline">← Volver al login</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  sent = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
