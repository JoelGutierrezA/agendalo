import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface Service {
  id: number;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../../core/services/toast.service';

/** Gestión de servicios del negocio */
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

      <!-- Estado de carga -->
      @if (loading) {
        <div class="card p-0 overflow-hidden">
          <table class="w-full text-sm text-left">
            <thead class="bg-gray-50/50 border-b border-border">
              <tr>
                <th class="px-5 py-3 h-10 w-48"><div class="skeleton h-4 w-32"></div></th>
                <th class="px-5 py-3 h-10 hidden sm:table-cell"><div class="skeleton h-4 w-20"></div></th>
                <th class="px-5 py-3 h-10 hidden sm:table-cell"><div class="skeleton h-4 w-20"></div></th>
                <th class="px-5 py-3 h-10 text-center"><div class="skeleton h-4 w-12 mx-auto"></div></th>
                <th class="px-5 py-3 h-10 text-right"><div class="skeleton h-4 w-24 ml-auto"></div></th>
              </tr>
            </thead>
            <tbody>
              @for (i of [1,2,3,4]; track i) {
                <tr>
                  <td class="px-5 py-4"><div class="skeleton-text w-40"></div><div class="skeleton-text w-56 h-3 mt-2"></div></td>
                  <td class="px-5 py-4 hidden sm:table-cell"><div class="skeleton-text w-16"></div></td>
                  <td class="px-5 py-4 hidden sm:table-cell"><div class="skeleton-text w-20"></div></td>
                  <td class="px-5 py-4 text-center"><div class="skeleton w-16 h-6 rounded-full mx-auto"></div></td>
                  <td class="px-5 py-4 text-right"><div class="skeleton w-24 h-8 rounded-lg ml-auto"></div></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Estado vacío -->
      @if (!loading && services.length === 0) {
        <app-empty-state
          icon="✂️"
          title="No hay servicios configurados"
          description="Crea los servicios que ofreces para que aparezcan en tu página de reservas"
          actionLabel="Crear primer servicio"
          (onAction)="openModal()"
        ></app-empty-state>
      }

      <!-- Lista de servicios -->
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
            <tbody class="fade-in">
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
                        class="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"
                        title="Editar"
                      >✏️</button>
                      <button
                        (click)="confirmDelete(service)"
                        class="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Modal crear/editar -->
    @if (showModal) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeModal()">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
          <div class="px-6 py-5 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold text-text-primary">
              {{ editingId ? 'Editar servicio' : 'Nuevo servicio' }}
            </h2>
            <button (click)="closeModal()" class="text-text-secondary hover:text-text-primary text-xl leading-none">✕</button>
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
              <textarea formControlName="description" class="form-input" rows="2" placeholder="Descripción opcional del servicio..."></textarea>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="form-label">Duración (min) *</label>
                <input type="number" formControlName="duration_minutes" class="form-input" placeholder="30" min="5" max="480" />
                @if (form.get('duration_minutes')?.invalid && form.get('duration_minutes')?.touched) {
                  <p class="form-error">Entre 5 y 480 min</p>
                }
              </div>
              <div>
                <label class="form-label">Precio (CLP) *</label>
                <input type="number" formControlName="price" class="form-input" placeholder="15000" min="0" step="500" />
                @if (form.get('price')?.invalid && form.get('price')?.touched) {
                  <p class="form-error">Precio requerido</p>
                }
              </div>
            </div>

            <div class="flex items-center gap-3">
              <input type="checkbox" formControlName="is_active" id="is_active" class="w-4 h-4 accent-primary" />
              <label for="is_active" class="text-sm text-text-primary cursor-pointer">Servicio activo (visible para clientes)</label>
            </div>


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

    <!-- Modal confirmación eliminación -->
    @if (deletingService) {
      <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-surface rounded-2xl shadow-xl w-full max-w-sm p-6">
          <div class="text-center mb-4">
            <span class="text-4xl">⚠️</span>
            <h3 class="text-lg font-semibold text-text-primary mt-3">¿Eliminar servicio?</h3>
            <p class="text-text-secondary text-sm mt-1">
              Vas a eliminar <strong>{{ deletingService.name }}</strong>. Esta acción no se puede deshacer.
            </p>
          </div>
          <div class="flex gap-3">
            <button (click)="deletingService = null" class="btn-secondary flex-1">Cancelar</button>
            <button (click)="deleteService()" class="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors" [disabled]="submitting">
              @if (submitting) { Eliminando... } @else { Sí, eliminar }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ServicesListComponent implements OnInit {
  private readonly apiUrl = `${environment.apiUrl}/services`;

  services: Service[] = [];
  loading   = true;
  showModal = false;
  editingId: number | null = null;
  deletingService: Service | null = null;
  submitting = false;

  form: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      name:             ['', [Validators.required, Validators.maxLength(255)]],
      description:      [''],
      duration_minutes: [30, [Validators.required, Validators.min(5), Validators.max(480)]],
      price:            [0,  [Validators.required, Validators.min(0)]],
      is_active:        [true],
    });
  }

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.http.get<{ data: Service[] }>(this.apiUrl).subscribe({
      next: (res) => { this.services = res.data ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openModal(service?: Service): void {
    this.editingId  = service?.id ?? null;
    this.form.reset({
      name:             service?.name ?? '',
      description:      service?.description ?? '',
      duration_minutes: service?.duration_minutes ?? 30,
      price:            service?.price ?? 0,
      is_active:        service?.is_active ?? true,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;

    const payload = this.form.value;
    const request = this.editingId
      ? this.http.put<{ data: Service }>(`${this.apiUrl}/${this.editingId}`, payload)
      : this.http.post<{ data: Service }>(this.apiUrl, payload);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success(this.editingId ? 'Servicio actualizado' : 'Servicio creado con éxito');
        this.closeModal();
        this.loadServices();
      },
      error: () => {
        this.submitting = false;
      }
    });
  }

  toggleActive(service: Service): void {
    this.http.patch<{ data: Service }>(`${this.apiUrl}/${service.id}/toggle-active`, {}).subscribe({
      next: (res) => {
        const idx = this.services.findIndex(s => s.id === service.id);
        if (idx !== -1 && res.data) { 
          this.services[idx] = res.data;
          this.toastService.info(`Servicio ${res.data.is_active ? 'activado' : 'desactivado'}`);
        }
      }
    });
  }

  confirmDelete(service: Service): void {
    this.deletingService = service;
  }

  deleteService(): void {
    if (!this.deletingService) return;
    this.submitting = true;
    this.http.delete(`${this.apiUrl}/${this.deletingService.id}`).subscribe({
      next: () => {
        this.services = this.services.filter(s => s.id !== this.deletingService?.id);
        this.toastService.success('Servicio eliminado');
        this.deletingService = null;
        this.submitting = false;
      },
      error: () => { this.submitting = false; }
    });
  }
}
