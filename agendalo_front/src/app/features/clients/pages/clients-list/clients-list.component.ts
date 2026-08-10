import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../../core/services/toast.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { BusinessService } from '../../../settings/services/business.service';

interface Client {
  id: number;
  business_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  last_visit_at: string | null;
  created_at: string;
  appointments_count?: number;
}

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, EmptyStateComponent],
  template: `
    <div>
      <div class="page-header flex gap-4 justify-between items-center flex-wrap">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/Interfaz/Clientes.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
            <h1 class="page-title">Clientes</h1>
          </div>
        </div>
        <button class="btn-primary flex-shrink-0" (click)="openModal()">
          <span>+</span> Nuevo cliente
        </button>
      </div>

      <div class="card mb-4">
        <div class="flex gap-3">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (keyup.enter)="loadClients()"
            class="form-input flex-1"
            placeholder="Buscar por nombre, email o teléfono..."
          />
          <button class="btn-secondary" (click)="loadClients()">Buscar</button>
          @if (searchQuery) {
            <button class="text-sm text-primary hover:underline px-2" (click)="clearSearch()">Limpiar</button>
          }
        </div>
      </div>

      <div class="card p-0 overflow-hidden">
        @if (loading) {
          <div class="py-16 text-center text-text-secondary animate-pulse">Cargando clientes...</div>
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
                      @if (client.email) {
                        <p class="text-text-secondary truncate max-w-[180px]" [title]="client.email">Email: {{ client.email }}</p>
                      }
                      @if (client.phone) {
                        <p class="text-text-secondary truncate mt-0.5">Tel: {{ client.phone }}</p>
                      }
                      @if (!client.email && !client.phone) {
                        <span class="text-gray-400 italic">Sin datos</span>
                      }
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
                      <div class="flex items-center justify-end gap-2">
                        <a [routerLink]="['/app/clientes', client.id]" class="btn-icon" title="Ver perfil">Ver</a>
                        <button (click)="openModal(client)" class="btn-icon" title="Editar">Editar</button>
                        <button (click)="deleteClient(client)" class="btn-icon text-red-600" title="Eliminar">Eliminar</button>
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
                  <input type="text" formControlName="name" class="form-input" placeholder="Ej: Juan Perez" />
                  @if (f['name'].invalid && f['name'].touched) {
                    <p class="form-error">Nombre requerido</p>
                  }
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Email</label>
                    <input type="email" formControlName="email" class="form-input" placeholder="correo@..." />
                    @if (f['email'].invalid && f['email'].touched) {
                      <p class="form-error">Email inválido</p>
                    }
                  </div>
                  <div>
                    <label class="form-label">Telefono *</label>
                    <div class="input-group">
                      <span class="input-prefix">+56 9</span>
                      <input type="text" formControlName="phone" class="form-input" placeholder="12345678" maxlength="8" />
                    </div>
                    @if (f['phone'].invalid && f['phone'].touched) {
                      <p class="form-error">Ingresa los 8 dígitos</p>
                    }
                  </div>
                </div>

                <div>
                  <label class="form-label">Notas o alergias</label>
                  <textarea formControlName="notes" class="form-input" rows="2" placeholder="Informacion interna..."></textarea>
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
    .btn-icon {
      border-radius: 0.5rem;
      padding: 0.35rem 0.55rem;
      color: var(--color-text-secondary, #64748b);
      font-size: 0.75rem;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    .btn-icon:hover {
      background: #f1f5f9;
      color: var(--color-primary, #2563eb);
    }
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

  showModal = false;
  isEditing = false;
  saving = false;
  editingId: number | null = null;

  clientForm: FormGroup;
  get f() { return this.clientForm.controls; }

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private businessService: BusinessService,
    private supabase: SupabaseService
  ) {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.email],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    void this.loadClients();
  }

  async loadClients(): Promise<void> {
    this.loading = true;
    const business = this.businessService.currentBusiness();

    if (!business) {
      this.clients = [];
      this.loading = false;
      this.toastService.error('No hay un negocio seleccionado.');
      return;
    }

    try {
      const search = this.searchQuery.trim();
      let query = this.supabase.client
        .from('clients')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      this.clients = await this.withAppointmentCounts(business.id, (data ?? []) as Client[]);
    } catch (error: any) {
      this.toastService.error(error?.message ?? 'No se pudieron cargar los clientes.');
    } finally {
      this.loading = false;
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    void this.loadClients();
  }

  openModal(client?: Client): void {
    if (client) {
      this.isEditing = true;
      this.editingId = client.id;
      this.clientForm.patchValue({
        name: client.name,
        email: client.email,
        phone: this.toLocalPhone(client.phone),
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

  async saveClient(): Promise<void> {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const business = this.businessService.currentBusiness();
    if (!business) {
      this.toastService.error('No hay un negocio seleccionado.');
      return;
    }

    this.saving = true;

    const payload = {
      business_id: business.id,
      name: this.clientForm.value.name,
      email: this.clientForm.value.email || null,
      phone: this.toSupabasePhone(this.clientForm.value.phone),
      notes: this.clientForm.value.notes || null,
    };

    try {
      const result = this.isEditing && this.editingId
        ? await this.supabase.client
          .from('clients')
          .update(payload)
          .eq('id', this.editingId)
          .eq('business_id', business.id)
        : await this.supabase.client
          .from('clients')
          .insert(payload);

      if (result.error) throw new Error(result.error.message);

      this.toastService.success(this.isEditing ? 'Cliente actualizado' : 'Cliente registrado con exito');
      this.closeModal();
      await this.loadClients();
    } catch (error: any) {
      this.toastService.error(error?.message ?? 'No se pudo guardar el cliente.');
    } finally {
      this.saving = false;
    }
  }

  async deleteClient(client: Client): Promise<void> {
    if (!confirm(`Eliminar a ${client.name}?`)) return;

    const business = this.businessService.currentBusiness();
    if (!business) {
      this.toastService.error('No hay un negocio seleccionado.');
      return;
    }

    const { error } = await this.supabase.client
      .from('clients')
      .delete()
      .eq('id', client.id)
      .eq('business_id', business.id);

    if (error) {
      this.toastService.error(error.message);
      return;
    }

    this.toastService.success('Cliente eliminado');
    await this.loadClients();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private async withAppointmentCounts(businessId: number, clients: Client[]): Promise<Client[]> {
    if (clients.length === 0) return clients;

    const ids = clients.map(client => client.id);
    const { data, error } = await this.supabase.client
      .from('appointments')
      .select('client_id')
      .eq('business_id', businessId)
      .in('client_id', ids);

    if (error) throw new Error(error.message);

    const counts = new Map<number, number>();
    for (const appointment of data ?? []) {
      const clientId = appointment.client_id;
      if (clientId) counts.set(clientId, (counts.get(clientId) ?? 0) + 1);
    }

    return clients.map(client => ({
      ...client,
      appointments_count: counts.get(client.id) ?? 0,
    }));
  }

  private toLocalPhone(phone: string | null): string {
    return phone?.replace(/^\+?569/, '').replace(/\D/g, '').slice(0, 8) ?? '';
  }

  private toSupabasePhone(phone: string): string {
    return `+569${phone.replace(/\D/g, '')}`;
  }
}
