import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { ApiResponse } from '../../../../models/auth.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PlatformService } from '../../services/platform.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto p-6">
      <div class="page-header">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/Interfaz/Clientes.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
            <h1 class="page-title">Administracion de Usuarios</h1>
          </div>
        </div>
        <a routerLink="/admin-plataforma" class="btn-secondary">Volver</a>
      </div>

      <div class="card p-0 overflow-hidden">
        <div class="overflow-x-auto text-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Usuario</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Email</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Rol</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Estado</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @if (loading) {
                @for (i of [1,2,3,4,5]; track i) {
                  <tr>
                    <td class="p-4"><div class="skeleton-text w-32 h-4"></div><div class="skeleton-text w-16 h-2 mt-2"></div></td>
                    <td class="p-4"><div class="skeleton-text w-48 h-4"></div></td>
                    <td class="p-4"><div class="skeleton w-16 h-6 rounded-lg"></div></td>
                    <td class="p-4"><div class="skeleton w-20 h-6 rounded-lg"></div></td>
                    <td class="p-4 text-right"><div class="skeleton w-24 h-10 rounded-xl ml-auto"></div></td>
                  </tr>
                }
              } @else {
                @for (user of users; track user.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors fade-in">
                    <td class="p-4">
                      <div class="font-bold text-text-primary">{{ user.name }}</div>
                      <div class="text-[10px] text-text-secondary italic">ID: #{{ user.id }}</div>
                    </td>
                    <td class="p-4 text-text-secondary font-medium">{{ user.email }}</td>
                    <td class="p-4">
                      <span
                        class="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight"
                        [class]="user.role === 'admin_platform' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                      >
                        {{ user.role === 'admin_platform' ? 'Admin' : 'Dueno' }}
                      </span>
                    </td>
                    <td class="p-4 text-xs font-semibold">
                      <span
                        class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        [class]="user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                      >
                        <span class="w-2 h-2 rounded-full" [class]="user.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                        {{ user.is_active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      @if (user.role !== 'admin_platform') {
                        <div class="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            (click)="toggleStatus(user)"
                            class="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all border disabled:opacity-50 disabled:cursor-not-allowed"
                            [disabled]="deletingUserId === user.id"
                            [attr.aria-label]="user.is_active ? 'Dar de baja usuario' : 'Dar de alta usuario'"
                            [title]="user.is_active ? 'Dar de baja' : 'Dar de alta'"
                            [class]="user.is_active ? 'text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300' : 'text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300'"
                          >
                            @if (user.is_active) {
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M12 2v10"></path>
                                <path d="M18.4 6.6a9 9 0 1 1-12.8 0"></path>
                              </svg>
                            } @else {
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M20 6 9 17l-5-5"></path>
                              </svg>
                            }
                          </button>
                          <button
                            type="button"
                            (click)="deleteUser(user)"
                            class="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all border text-red-700 border-red-300 hover:bg-red-50 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            [disabled]="deletingUserId === user.id"
                            aria-label="Eliminar usuario"
                            title="Eliminar"
                          >
                            @if (deletingUserId === user.id) {
                              <span class="h-4 w-4 rounded-full border-2 border-red-200 border-t-red-700 animate-spin" aria-hidden="true"></span>
                            } @else {
                              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M3 6h18"></path>
                                <path d="M8 6V4h8v2"></path>
                                <path d="M19 6l-1 14H6L5 6"></path>
                                <path d="M10 11v5"></path>
                                <path d="M14 11v5"></path>
                              </svg>
                            }
                          </button>
                        </div>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
          @if (users.length === 0 && !loading) {
            <app-empty-state
              icon="users"
              title="No hay usuarios registrados"
              description="Aun no hay usuarios registrados en la plataforma."
            ></app-empty-state>
          }
        </div>

        <div class="p-4 border-t border-border flex justify-between items-center bg-gray-50/30">
          <span class="text-xs font-medium text-text-secondary">Pagina {{ currentPage }} de {{ lastPage }}</span>
          <div class="flex gap-2">
            <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage === 1" class="btn-secondary btn-sm px-4">Anterior</button>
            <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage === lastPage" class="btn-secondary btn-sm px-4">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = true;
  currentPage = 1;
  lastPage = 1;
  deletingUserId: string | null = null;

  constructor(
    private platformService: PlatformService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading = true;
    this.platformService.getUsers(page).subscribe({
      next: (res: ApiResponse<any>) => {
        this.users = res.data.data;
        this.currentPage = res.data.current_page;
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  toggleStatus(user: any): void {
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!confirm(`Estas seguro de que deseas ${action} el acceso de ${user.name}?`)) return;

    this.platformService.toggleUserStatus(user.id).subscribe({
      next: () => {
        user.is_active = !user.is_active;
        this.toastService.success(`Usuario ${user.is_active ? 'activado' : 'desactivado'}.`);
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo actualizar el usuario');
      },
    });
  }

  deleteUser(user: any): void {
    const confirmed = confirm(
      `Esta accion eliminara definitivamente la cuenta de ${user.name} (${user.email}) y sus datos asociados. Esta accion no se puede deshacer.`
    );

    if (!confirmed) return;

    this.deletingUserId = user.id;
    this.platformService.deleteUser(user.id).subscribe({
      next: () => {
        this.users = this.users.filter(current => current.id !== user.id);
        this.toastService.success('Usuario eliminado definitivamente.');

        if (this.users.length === 0 && this.currentPage > 1) {
          this.loadPage(this.currentPage - 1);
          return;
        }

        this.deletingUserId = null;
      },
      error: (err) => {
        this.toastService.error(err?.message ?? 'No se pudo eliminar el usuario');
        this.deletingUserId = null;
      },
    });
  }
}
