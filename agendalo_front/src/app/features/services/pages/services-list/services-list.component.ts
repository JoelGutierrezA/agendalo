import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../../core/services/toast.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { BusinessService } from '../../../settings/services/business.service';
import { SubscriptionService } from '../../../subscription/services/subscription.service';
import type { ServiceModality } from '../../../../models/auth.models';
import { GoogleCalendarService, GoogleCalendarStatus } from '../../../settings/services/google-calendar.service';

interface Service {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  modality: ServiceModality;
  generate_google_meet: boolean;
}

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, EmptyStateComponent],
  template: `
    <div>
      <div class="page-header">
        <div class="flex items-center gap-3">
          <img src="assets/Interfaz/Servicios.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
          <h1 class="page-title">Servicios</h1>
        </div>
        <button class="btn-primary disabled:cursor-not-allowed disabled:opacity-50" [disabled]="!canOperate()" (click)="openModal()">
          <span>+</span> Nuevo servicio
        </button>
      </div>

      @if (loading) {
        <div class="card">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      }

      @if (!loading && services.length === 0) {
        <app-empty-state
          icon="+"
          title="No hay servicios configurados"
          description="Crea los servicios que ofreces para que aparezcan en tu página de reservas"
          actionLabel="Crear primer servicio"
          (onAction)="openModal()"
        ></app-empty-state>
      }

      @if (!loading && services.length > 0) {
        <div class="card p-0 overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-gray-50/50">
                <th class="text-left px-5 py-3 text-text-secondary font-medium">Servicio</th>
                <th class="text-left px-5 py-3 text-text-secondary font-medium hidden sm:table-cell">Duración</th>
                <th class="text-left px-5 py-3 text-text-secondary font-medium hidden sm:table-cell">Precio</th>
                <th class="text-center px-5 py-3 text-text-secondary font-medium">Estado</th>
                <th class="text-right px-5 py-3 text-text-secondary font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (service of services; track service.id) {
                <tr class="border-b border-border last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td class="px-5 py-3.5">
                    <p class="font-medium text-text-primary">{{ service.name }}</p>
                    @if (service.description) {
                      <p class="text-text-secondary text-xs mt-0.5 line-clamp-1">{{ service.description }}</p>
                    }
                    <div class="mt-2 flex flex-wrap items-center gap-1.5">
                      <span
                        class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        [ngClass]="service.modality === 'online' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-text-secondary'"
                      >
                        {{ service.modality === 'online' ? 'Online' : 'Presencial' }}
                      </span>
                      @if (service.modality === 'online' && service.generate_google_meet) {
                        <span class="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Google Meet
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-5 py-3.5 hidden sm:table-cell text-text-secondary">
                    {{ service.duration_minutes }} min
                  </td>
                  <td class="px-5 py-3.5 hidden sm:table-cell font-medium text-text-primary">
                    {{ service.price | number:'1.0-0' }} CLP
                  </td>
                  <td class="px-5 py-3.5 text-center">
                    <button
                      (click)="toggleActive(service)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      [disabled]="!canOperate()"
                      [class]="service.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full" [class]="service.is_active ? 'bg-green-500' : 'bg-gray-400'"></span>
                      {{ service.is_active ? 'Activo' : 'Inactivo' }}
                    </button>
                  </td>
                  <td class="px-5 py-3.5">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        (click)="openModal(service)"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary-light hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        [disabled]="!canOperate()"
                        title="Editar"
                        aria-label="Editar servicio"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        (click)="confirmDelete(service)"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        [disabled]="!canOperate()"
                        title="Eliminar"
                        aria-label="Eliminar servicio"
                      >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    @if (showModal) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeModal()">
        <div class="bg-surface rounded-lg shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
          <div class="px-6 py-5 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-text-primary">
              {{ editingId ? 'Editar servicio' : 'Nuevo servicio' }}
            </h2>
            <button (click)="closeModal()" class="text-text-secondary hover:text-text-primary text-xl leading-none">x</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="px-6 py-5 space-y-4">
            <div>
              <label class="form-label">Nombre del servicio *</label>
              <input type="text" formControlName="name" class="form-input" placeholder="Ej: Corte de cabello" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <p class="form-error">El nombre es requerido</p>
              }
            </div>

            <div>
              <label class="form-label">Descripción</label>
              <textarea formControlName="description" class="form-input" rows="2" placeholder="Descripción opcional del servicio"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Duración (min) *</label>
                <input type="number" formControlName="duration_minutes" class="form-input" min="5" max="480" />
                @if (form.get('duration_minutes')?.invalid && form.get('duration_minutes')?.touched) {
                  <p class="form-error">Entre 5 y 480 min</p>
                }
              </div>
              <div>
                <label class="form-label">Precio (CLP) *</label>
                <input type="number" formControlName="price" class="form-input" min="0" step="500" />
                @if (form.get('price')?.invalid && form.get('price')?.touched) {
                  <p class="form-error">Precio requerido</p>
                }
              </div>
            </div>

            <div>
              <label class="form-label">Modalidad *</label>
              <div class="grid grid-cols-2 gap-3">
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors"
                  [ngClass]="form.value.modality === 'presencial' ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-primary hover:border-primary-light'"
                >
                  <input type="radio" formControlName="modality" value="presencial" class="h-4 w-4 accent-primary" />
                  <span class="font-semibold">Presencial</span>
                </label>
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-colors"
                  [ngClass]="form.value.modality === 'online' ? 'border-primary bg-primary-light text-primary' : 'border-border text-text-primary hover:border-primary-light'"
                >
                  <input type="radio" formControlName="modality" value="online" class="h-4 w-4 accent-primary" />
                  <span class="font-semibold">Online</span>
                </label>
              </div>
            </div>

            @if (isOnlineSelected()) {
              <div class="rounded-lg border border-border bg-gray-50/60 p-3">
                <label class="flex items-start gap-3 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    formControlName="generate_google_meet"
                    class="mt-0.5 h-4 w-4 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
                    [disabled]="googleStatusLoading || !googleConnected()"
                  />
                  <span>
                    <span class="block font-semibold">Generar Google Meet automáticamente</span>
                    @if (googleStatusLoading) {
                      <span class="mt-1 block text-xs text-text-secondary">
                        Consultando estado de Google Calendar...
                      </span>
                    } @else if (!googleConnected()) {
                      <span class="mt-1 block text-xs text-amber-700">
                        Vincula tu cuenta de Google para generar reuniones de Meet automáticamente.
                      </span>
                      <a
                        routerLink="/app/configuracion"
                        [queryParams]="{ tab: 'calendar' }"
                        class="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
                      >
                        Ir a Configuración
                      </a>
                    }
                  </span>
                </label>

                @if (form.value.generate_google_meet && googleConnected()) {
                  <p class="mt-3 text-xs text-text-secondary">
                    Skedia creará un enlace de Google Meet al agendar este servicio.
                  </p>
                }

                @if (!form.value.generate_google_meet || !googleConnected()) {
                  <p class="mt-3 text-xs text-text-secondary">
                    ¿Usarás otra plataforma de videollamada?<br>
                    Recuerda compartir con tu cliente el enlace de Zoom, Teams u otra plataforma antes de la sesión.
                  </p>
                }
              </div>
            }

            <label class="flex items-center gap-3 text-sm text-text-primary cursor-pointer">
              <input type="checkbox" formControlName="is_active" class="w-4 h-4 accent-primary" />
              Servicio activo
            </label>

            <div class="flex items-center justify-end gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary" [disabled]="submitting">
                @if (submitting) { Guardando... } @else { {{ editingId ? 'Guardar cambios' : 'Crear servicio' }} }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (deletingService) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-lg shadow-xl w-full max-w-sm p-6">
          <div class="text-center mb-4">
            <h3 class="text-lg font-semibold text-text-primary">Eliminar servicio</h3>
            <p class="text-text-secondary text-sm mt-1">
              Vas a eliminar <strong>{{ deletingService.name }}</strong>. Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="flex gap-3">
            <button (click)="deletingService = null" class="btn-secondary flex-1">Cancelar</button>
            <button
              (click)="deleteService()"
              class="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              [disabled]="submitting"
            >
              @if (submitting) { Eliminando... } @else { Eliminar }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ServicesListComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  loading = true;
  showModal = false;
  editingId: number | null = null;
  deletingService: Service | null = null;
  submitting = false;
  googleStatus: GoogleCalendarStatus | null = null;
  googleStatusLoading = false;
  private googleStatusSubscription?: Subscription;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private businessService: BusinessService,
    private supabase: SupabaseService,
    private subscriptionService: SubscriptionService,
    private googleCalendarService: GoogleCalendarService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      duration_minutes: [30, [Validators.required, Validators.min(5), Validators.max(480)]],
      price: [0, [Validators.required, Validators.min(0)]],
      modality: ['presencial', Validators.required],
      generate_google_meet: [false],
      is_active: [true],
    });

    this.form.get('modality')?.valueChanges.subscribe((modality) => {
      if (modality === 'presencial') {
        this.form.patchValue({ generate_google_meet: false }, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.loadGoogleStatus();
    this.loadServices();
  }

  ngOnDestroy(): void {
    this.googleStatusSubscription?.unsubscribe();
  }

  loadServices(): void {
    const business = this.businessService.currentBusiness();

    if (!business) {
      this.loading = false;
      this.toastService.error('No hay un negocio seleccionado');
      return;
    }

    this.loading = true;

    void this.supabase.client
      .from('services')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          this.toastService.error(error.message);
          this.loading = false;
          return;
        }

        this.services = (data ?? []).map(service => this.mapService(service));
        this.loading = false;
      });
  }

  openModal(service?: Service): void {
    if (!this.assertOperationAllowed()) return;

    this.editingId = service?.id ?? null;
    this.form.reset({
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration_minutes: service?.duration_minutes ?? 30,
      price: service?.price ?? 0,
      modality: service?.modality ?? 'presencial',
      generate_google_meet: service?.modality === 'online' && service.generate_google_meet === true,
      is_active: service?.is_active ?? true,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  onSubmit(): void {
    if (!this.assertOperationAllowed()) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const business = this.businessService.currentBusiness();
    if (!business) {
      this.toastService.error('No hay un negocio seleccionado');
      return;
    }

    this.submitting = true;
    const values = this.form.getRawValue();
    const modality: ServiceModality = values.modality === 'online' ? 'online' : 'presencial';

    const payload = {
      business_id: business.id,
      name: values.name,
      description: values.description || null,
      duration_minutes: Number(values.duration_minutes),
      price: Number(values.price),
      modality,
      generate_google_meet: modality === 'online' && values.generate_google_meet === true,
      is_active: Boolean(values.is_active),
    };

    const request = this.editingId
      ? this.supabase.client
          .from('services')
          .update(payload)
          .eq('id', this.editingId)
          .eq('business_id', business.id)
          .select('*')
          .single()
      : this.supabase.client
          .from('services')
          .insert(payload)
          .select('*')
          .single();

    void request.then(({ error }) => {
      if (error) {
        this.toastService.error(error.message);
        this.submitting = false;
        return;
      }

      this.toastService.success(this.editingId ? 'Servicio actualizado' : 'Servicio creado con exito');
      this.submitting = false;
      this.closeModal();
      this.loadServices();
    });
  }

  toggleActive(service: Service): void {
    if (!this.assertOperationAllowed()) return;

    const business = this.businessService.currentBusiness();
    if (!business) return;

    void this.supabase.client
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id)
      .eq('business_id', business.id)
      .select('*')
      .single()
      .then(({ data, error }) => {
        if (error) {
          this.toastService.error(error.message);
          return;
        }

        const idx = this.services.findIndex(item => item.id === service.id);
        if (idx !== -1 && data) {
          const updated = this.mapService(data);
          this.services[idx] = updated;
          this.toastService.info(`Servicio ${updated.is_active ? 'activado' : 'desactivado'}`);
        }
      });
  }

  confirmDelete(service: Service): void {
    if (!this.assertOperationAllowed()) return;

    this.deletingService = service;
  }

  deleteService(): void {
    if (!this.assertOperationAllowed()) return;

    const business = this.businessService.currentBusiness();
    if (!this.deletingService || !business) return;

    this.submitting = true;

    void this.supabase.client
      .from('services')
      .delete()
      .eq('id', this.deletingService.id)
      .eq('business_id', business.id)
      .then(({ error }) => {
        if (error) {
          this.toastService.error(error.message);
          this.submitting = false;
          return;
        }

        this.services = this.services.filter(service => service.id !== this.deletingService?.id);
        this.toastService.success('Servicio eliminado');
        this.deletingService = null;
        this.submitting = false;
      });
  }

  canOperate(): boolean {
    return this.subscriptionService.canOperate();
  }

  isOnlineSelected(): boolean {
    return this.form.value.modality === 'online';
  }

  googleConnected(): boolean {
    return this.googleStatus?.connected === true;
  }

  private loadGoogleStatus(): void {
    this.googleStatusLoading = true;
    this.googleStatusSubscription = this.googleCalendarService.getStatus().subscribe({
      next: (status) => {
        this.googleStatus = status;
        this.googleStatusLoading = false;
      },
      error: () => {
        this.googleStatus = null;
        this.googleStatusLoading = false;
      },
    });
  }

  private assertOperationAllowed(): boolean {
    if (this.subscriptionService.canOperate()) return true;

    this.toastService.error('Tu suscripcion esta en periodo de gracia. Puedes consultar servicios, pero debes renovar para realizar cambios.');
    return false;
  }

  private mapService(row: any): Service {
    return {
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      description: row.description,
      duration_minutes: row.duration_minutes,
      price: Number(row.price),
      is_active: row.is_active,
      modality: row.modality === 'online' ? 'online' : 'presencial',
      generate_google_meet: row.modality === 'online' && row.generate_google_meet === true,
    };
  }
}
