import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../../../../environments/environment';

interface Client {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  last_visit_at: string | null;
  appointments_count?: number;
}

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, EmptyStateComponent],
  template: `
    <div>
      <div class="page-header flex gap-4 justify-between items-center flex-wrap">
        <div>
          <h1 class="page-title">Clientes</h1>
          <p class="text-text-secondary text-sm">Gestiona la base de datos de tus clientes</p>
        </div>
        <button class="btn-primary flex-shrink-0" (click)="openModal()"><span>+</span> Nuevo cliente</button>
      </div>

      <!-- Búsqueda -->
      <div class="card mb-4">
        <div class="flex gap-3">
          <input type="text" [(ngModel)]="searchQuery" (keyup.enter)="loadClients()" class="form-input flex-1" placeholder="Buscar por nombre, email o teléfono..." />
          <button class="btn-secondary" (click)="loadClients()">Buscar</button>
          @if (searchQuery) {
            <button class="text-sm text-primary hover:underline px-2" (click)="searchQuery=''; loadClients()">Limpiar</button>
          }
        </div>
      </div>

      <!-- Tabla de clientes -->
      <div class="card p-0 overflow-hidden">
        @if (loading) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50/50 border-b border-border">
                <tr>
                  <th class="px-5 py-3 h-10 w-48"><div class="skeleton h-4 w-32"></div></th>
                  <th class="px-5 py-3 h-10"><div class="skeleton h-4 w-40"></div></th>
                  <th class="px-5 py-3 h-10"><div class="skeleton h-4 w-24"></div></th>
                  <th class="px-5 py-3 h-10 text-center"><div class="skeleton h-4 w-12 mx-auto"></div></th>
                  <th class="px-5 py-3 h-10 text-right"><div class="skeleton h-4 w-24 ml-auto"></div></th>
                </tr>
              </thead>
              <tbody>
                @for (i of [1,2,3,4,5]; track i) {
                  <tr>
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                        <div class="skeleton-circle w-8 h-8"></div>
                        <div class="skeleton-text w-32 h-4 mb-0"></div>
                      </div>
                    </td>
                    <td class="px-5 py-4"><div class="skeleton-text w-40 h-3"></div><div class="skeleton-text w-24 h-3 mt-2"></div></td>
                    <td class="px-5 py-4"><div class="skeleton-text w-20 h-4"></div></td>
                    <td class="px-5 py-4 text-center"><div class="skeleton-circle w-6 h-6 mx-auto"></div></td>
                    <td class="px-5 py-4 text-right"><div class="skeleton w-24 h-8 rounded-lg ml-auto"></div></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else if (clients.length === 0) {
          <app-empty-state
            icon="👥"
            [title]="searchQuery ? 'No se encontraron clientes' : 'No tienes clientes registrados'"
            [description]="searchQuery ? 'Prueba con otros términos de búsqueda.' : 'Los clientes se guardan al agendar citas manuales o por tu sitio público.'"
            [actionLabel]="!searchQuery ? 'Agregar primer cliente' : undefined"
            (onAction)="openModal()"
          ></app-empty-state>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-gray-50/50 border-b border-border text-text-secondary font-medium">
                <tr>
                  <th class="px-5 py-3 rounded-tl-xl">Cliente</th>
                  <th class="px-5 py-3">Contacto</th>
                  <th class="px-5 py-3">Última visita</th>
                  <th class="px-5 py-3 text-center">Citas</th>
                  <th class="px-5 py-3 text-right rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border fade-in">
                @for (client of clients; track client.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {{ client.name.charAt(0).toUpperCase() }}
                        </div>
                        <p class="font-medium text-text-primary">{{ client.name }}</p>
                      </div>
                    </td>
                    <td class="px-5 py-3">
                      @if (client.email) { <p class="text-text-secondary truncate max-w-[150px]" title="{{ client.email }}">✉️ {{ client.email }}</p> }
                      @if (client.phone) { <p class="text-text-secondary truncate mt-0.5">📞 {{ client.phone }}</p> }
                      @if (!client.email && !client.phone) { <span class="text-gray-400 italic">Sin datos</span> }
                    </td>
                    <td class="px-5 py-3 whitespace-nowrap">
                      @if (client.last_visit_at) {
                        <span class="text-text-primary">{{ formatDate(client.last_visit_at) }}</span>
                      } @else {
                        <span class="text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">No registra</span>
                      }
                    </td>
                    <td class="px-5 py-3 text-center">
                      <span class="inline-flex w-6 h-6 items-center justify-center bg-blue-50 text-blue-700 font-bold rounded-full text-xs">
                        {{ client.appointments_count || 0 }}
                      </span>
                    </td>
                    <td class="px-5 py-3">
                      <div class="flex items-center justify-end gap-2 text-xl">
                        <a [routerLink]="['/app/clientes', client.id]" class="p-1.5 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-primary-light" title="Ver Perfil">👤</a>
                        <button (click)="openModal(client)" class="p-1.5 text-text-secondary hover:text-green-600 transition-colors rounded-lg hover:bg-green-50" title="Editar">✏️</button>
                        <button (click)="deleteClient(client)" class="p-1.5 text-text-secondary hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal Crear/Editar Cliente -->
      @if (showModal) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
              <h3 class="text-lg font-bold text-text-primary">{{ isEditing ? 'Editar cliente' : 'Nuevo cliente' }}</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 text-xl font-bold p-2 leading-none">&times;</button>
            </div>
            
            <form [formGroup]="clientForm" (ngSubmit)="saveClient()" class="p-6">
              
              <div class="space-y-4">
                <div>
                  <label class="form-label">Nombre completo *</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="Ej: Juan Pérez" />
                  @if (f['name'].invalid && f['name'].touched) { <p class="form-error">Nombre requerido</p> }
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Email</label>
                    <input type="email" formControlName="email" class="form-input" placeholder="correo@..." />
                    @if (f['email'].invalid && f['email'].touched) { <p class="form-error">Email inválido</p> }
                  </div>
                  <div>
                    <label class="form-label">Teléfono *</label>
                    <div class="input-group">
                      <span class="input-prefix">+56 9</span>
                      <input type="text" formControlName="phone" class="form-input" placeholder="1234 5678" maxlength="8" />
                    </div>
                    @if (f['phone'].invalid && f['phone'].touched) { 
                      <p class="form-error">Ingresa los 8 dígitos</p> 
                    }
                  </div>
                </div>

                <div>
                  <label class="form-label">Notas o alergias</label>
                  <textarea formControlName="notes" class="form-input" rows="2" placeholder="Información interna..."></textarea>
                </div>
              </div>


              <div class="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" class="btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn-primary" [disabled]="saving">
                  {{ saving ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.3s ease-out; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ClientsListComponent implements OnInit {
  clients: Client[] = [];
  loading = true;
  searchQuery = '';

  // Modal State
  showModal = false;
  isEditing = false;
  saving = false;
  editingId: number | null = null;

  clientForm: FormGroup;
  get f() { return this.clientForm.controls; }

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.email],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.loading = true;
    let params: any = {};
    if (this.searchQuery) {
      params.search = this.searchQuery;
    }
    
    this.http.get<any>(`${environment.apiUrl}/clients`, { params }).subscribe({
      next: (res) => {
        this.clients = res.data.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  openModal(client?: Client): void {
    if (client) {
      this.isEditing = true;
      this.editingId = client.id;
      this.clientForm.patchValue({
        name: client.name,
        email: client.email,
        phone: client.phone ? client.phone.replace('+569', '') : '',
        notes: client.notes
      });
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.clientForm.reset();
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.clientForm.reset();
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    this.saving = true;

    const payload = { 
      ...this.clientForm.value,
      phone: '+569' + this.clientForm.value.phone 
    };
    const req = this.isEditing && this.editingId
      ? this.http.put<{ data: Client }>(`${environment.apiUrl}/clients/${this.editingId}`, payload)
      : this.http.post<{ data: Client }>(`${environment.apiUrl}/clients`, payload);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success(this.isEditing ? 'Cliente actualizado' : 'Cliente registrado con éxito');
        this.closeModal();
        this.loadClients();
      },
      error: () => {
        this.saving = false;
      }
    });
  }

  deleteClient(client: Client): void {
    if (confirm(`¿Eliminar a ${client.name}?`)) {
      this.http.delete(`${environment.apiUrl}/clients/${client.id}`).subscribe({
        next: () => {
          this.toastService.success('Cliente eliminado');
          this.loadClients();
        }
      });
    }
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
