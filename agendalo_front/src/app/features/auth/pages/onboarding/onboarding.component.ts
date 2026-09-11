import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { BusinessService } from '../../../settings/services/business.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-5 fade-in">
      <div class="page-header">
        <div class="flex min-w-0 items-center gap-3">
          <img src="assets/Interfaz/Configuraci%C3%B3n.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
          <h1 class="page-title">Configura tu negocio</h1>
        </div>
      </div>

      <section class="card w-full max-w-4xl p-5 sm:p-6 lg:p-8">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="form-label">Nombre del negocio *</label>
              <input
                type="text"
                formControlName="name"
                class="form-input"
                [class.border-rose-400]="form.get('name')?.invalid && form.get('name')?.touched"
                placeholder="ej: Barberia Norte"
              />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="form-error">El nombre es requerido</p>
              }
            </div>

            <div class="sm:col-span-2">
              <label class="form-label">URL publica *</label>
              <div class="flex items-stretch">
                <span class="inline-flex items-center rounded-l-lg border border-r-0 border-border bg-gray-50 px-3 text-sm font-medium text-text-secondary whitespace-nowrap">
                  /negocio/
                </span>
                <input
                  type="text"
                  formControlName="slug"
                  class="form-input rounded-l-none"
                  [class.border-rose-400]="form.get('slug')?.invalid && form.get('slug')?.touched"
                  placeholder="barberia-norte"
                />
              </div>
              <p class="mt-1.5 text-xs text-text-secondary">
                Esta sera la direccion que podras compartir con tus clientes.
              </p>
            </div>

            <div>
              <label class="form-label">Telefono *</label>
              <div class="input-group">
                <span class="input-prefix">+56 9</span>
                <input
                  type="tel"
                  formControlName="phone"
                  class="form-input"
                  [class.border-rose-400]="form.get('phone')?.invalid && form.get('phone')?.touched"
                  placeholder="1234 5678"
                  maxlength="8"
                />
              </div>
              @if (form.get('phone')?.invalid && form.get('phone')?.touched) {
                <p class="form-error">Ingresa los 8 digitos</p>
              }
            </div>

            <div>
              <label class="form-label">Email publico</label>
              <input
                type="email"
                formControlName="email"
                class="form-input"
                [readOnly]="form.get('useAccountEmail')?.value"
                [class.bg-gray-50]="form.get('useAccountEmail')?.value"
                placeholder="negocio&#64;correo.com"
              />
            </div>

            @if (accountEmail) {
              <div class="sm:col-span-2">
                <label class="flex items-start gap-3 text-sm text-text-primary cursor-pointer">
                  <input type="checkbox" formControlName="useAccountEmail" class="w-4 h-4 mt-0.5 accent-primary flex-shrink-0" />
                  <span>
                    <span class="font-medium">Usar el correo de mi cuenta como email publico del negocio</span>
                    <span class="block text-xs text-text-secondary mt-0.5 break-all">{{ accountEmail }}</span>
                  </span>
                </label>
              </div>
            }

            <div class="sm:col-span-2">
              <label class="form-label">Descripcion</label>
              <textarea
                formControlName="description"
                class="form-input"
                rows="3"
                placeholder="Cuentales a tus clientes quienes son..."
              ></textarea>
            </div>

            <div class="sm:col-span-2">
              <label class="form-label">Direccion</label>
              <input
                type="text"
                formControlName="address"
                class="form-input"
                placeholder="Av. Principal 123, Ciudad"
              />
            </div>
          </div>

          <div class="flex justify-end border-t border-border pt-5">
            <button type="submit" class="btn-primary w-full justify-center py-2.5 sm:w-auto sm:px-6" [disabled]="loading">
              @if (loading) { Creando negocio... } @else { Guardar y continuar }
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class OnboardingComponent implements OnInit {
  form: FormGroup;
  loading = false;
  accountEmail = '';

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private router: Router,
    private toastService: ToastService,
    private authService: AuthService
  ) {
    this.accountEmail = this.authService.currentUser()?.email ?? '';

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      email: [this.accountEmail, [Validators.email]],
      useAccountEmail: [!!this.accountEmail],
      description: [''],
      address: [''],
    });

    this.form.get('name')?.valueChanges.subscribe(val => {
      if (val) {
        const slug = val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
        this.form.get('slug')?.setValue(slug, { emitEvent: false });
      }
    });

    this.form.get('useAccountEmail')?.valueChanges.subscribe(useAccountEmail => {
      const emailControl = this.form.get('email');
      if (!emailControl) return;

      if (useAccountEmail) {
        emailControl.setValue(this.accountEmail);
        return;
      }

      if (emailControl.value === this.accountEmail) {
        emailControl.setValue('');
      }
    });
  }

  ngOnInit(): void {
    if (this.businessService.hasBusiness()) {
      this.router.navigate(['/app/configuracion']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const formValue = { ...this.form.value };
    delete formValue.useAccountEmail;

    const payload = {
      ...formValue,
      phone: '+569' + formValue.phone,
    };

    this.businessService.createBusiness(payload).subscribe({
      next: () => {
        this.toastService.success('Negocio configurado con exito', 6000);
        this.router.navigate(['/app/dashboard']);
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo configurar el negocio.');
        this.loading = false;
      },
      complete: () => { this.loading = false; },
    });
  }
}
