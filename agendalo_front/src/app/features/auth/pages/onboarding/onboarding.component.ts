import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService } from '../../../settings/services/business.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-light via-white to-blue-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="text-center mb-8">
          <div class="flex justify-center h-12 mb-4">
            <img src="assets/Skedia_sf.png" alt="Skedia" class="h-full w-auto">
          </div>
          <h1 class="text-2xl font-bold text-text-primary">Configura tu negocio</h1>
          <p class="text-text-secondary mt-1">Esta información aparecerá en tu página pública de reservas</p>
        </div>

        <div class="card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="form-label">Nombre del negocio *</label>
                <input type="text" formControlName="name" 
                  class="form-input" 
                  [class.border-rose-400]="form.get('name')?.invalid && form.get('name')?.touched"
                  placeholder="ej: Barbería Norte" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="form-error">El nombre es requerido</p>
                }
              </div>

              <div class="sm:col-span-2">
                <label class="form-label">URL pública *</label>
                <div class="flex items-center">
                  <span class="px-3 py-2 bg-gray-100 border border-r-0 border-border rounded-l-lg text-text-secondary text-sm">/negocio/</span>
                  <input type="text" formControlName="slug" 
                    class="form-input rounded-l-none" 
                    [class.border-rose-400]="form.get('slug')?.invalid && form.get('slug')?.touched"
                    placeholder="barberia-norte" />
                </div>
                <p class="text-xs text-text-secondary mt-1">Solo letras, números y guiones. Será la URL de tu página pública.</p>
              </div>

              <div>
                <label class="form-label">Teléfono *</label>
                <div class="input-group">
                  <span class="input-prefix">+56 9</span>
                  <input type="tel" formControlName="phone" 
                    class="form-input" 
                    [class.border-rose-400]="form.get('phone')?.invalid && form.get('phone')?.touched"
                    placeholder="1234 5678" maxlength="8" />
                </div>
                @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
                  <p class="form-error">Ingresa los 8 dígitos</p>
                }
              </div>

              <div>
                <label class="form-label">Email del negocio</label>
                <input type="email" formControlName="email" class="form-input" placeholder="negocio&#64;correo.com" />
              </div>

              <div class="sm:col-span-2">
                <label class="form-label">Descripción</label>
                <textarea formControlName="description" class="form-input" rows="3"
                  placeholder="Cuéntales a tus clientes quiénes son..."></textarea>
              </div>

              <div class="sm:col-span-2">
                <label class="form-label">Dirección (opcional)</label>
                <input type="text" formControlName="address" class="form-input" placeholder="Av. Principal 123, Ciudad" />
              </div>
            </div>


            <button type="submit" class="btn-primary w-full justify-center py-2.5" [disabled]="loading">
              @if (loading) { Creando negocio... } @else { Crear mi negocio y continuar → }
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  form: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder, 
    private businessService: BusinessService, 
    private router: Router,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      email: ['', [Validators.email]],
      description: [''],
      address: [''],
    });

    // Auto-generar slug desde name
    this.form.get('name')?.valueChanges.subscribe(val => {
      if (val) {
        const slug = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        this.form.get('slug')?.setValue(slug, { emitEvent: false });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const payload = {
      ...this.form.value,
      phone: '+569' + this.form.value.phone
    };
    this.businessService.createBusiness(payload).subscribe({
      next: () => {
        this.toastService.success('¡Negocio configurado con éxito!', 6000);
        this.router.navigate(['/app/dashboard']);
      },
      error: () => {
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
