import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../../core/services/toast.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { BusinessService } from '../../../settings/services/business.service';

interface Service {
  id: number;
  business_id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent],
  template: `
    <div>
      <div class="page-header">
        <h1 class="page-title">Servicios</h1>
        <button class="btn-primary" (click)="openModal()">
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
          description="Crea los servicios que ofreces para que aparezcan en tu pagina de reservas"
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
                <th class="text-left px-5 py-3 text-text-secondary font-medium hidden sm:table-cell">Duracion</th>
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
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
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
                        (click)="openModal(service)"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-gray-50"
                      >Editar</button>
                      <button
                        (click)="confirmDelete(service)"
                        class="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50"
                      >Eliminar</button>
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
              <label class="form-label">Descripcion</label>
              <textarea formControlName="description" class="form-input" rows="2" placeholder="Descripcion opcional del servicio"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Duracion (min) *</label>
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
              Vas a eliminar <strong>{{ deletingService.name }}</strong>. Esta accion no se puede deshacer.
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
export class ServicesListComponent implements OnInit {
  services: Service[] = [];
  loading = true;
  showModal = false;
  editingId: number | null = null;
  deletingService: Service | null = null;
  submitting = false;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private businessService: BusinessService,
    private supabase: SupabaseService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      description: [''],
      duration_minutes: [30, [Validators.required, Validators.min(5), Validators.max(480)]],
      price: [0, [Validators.required, Validators.min(0)]],
      is_active: [true],
    });
  }

  ngOnInit(): void {
    this.loadServices();
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
    this.editingId = service?.id ?? null;
    this.form.reset({
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration_minutes: service?.duration_minutes ?? 30,
      price: service?.price ?? 0,
      is_active: service?.is_active ?? true,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  onSubmit(): void {
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

    const payload = {
      business_id: business.id,
      name: this.form.value.name,
      description: this.form.value.description || null,
      duration_minutes: Number(this.form.value.duration_minutes),
      price: Number(this.form.value.price),
      is_active: Boolean(this.form.value.is_active),
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
    this.deletingService = service;
  }

  deleteService(): void {
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

  private mapService(row: any): Service {
    return {
      id: row.id,
      business_id: row.business_id,
      name: row.name,
      description: row.description,
      duration_minutes: row.duration_minutes,
      price: Number(row.price),
      is_active: row.is_active,
    };
  }
}
