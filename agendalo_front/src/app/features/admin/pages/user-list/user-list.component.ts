import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlatformService } from '../../services/platform.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <div>
          <h1 class="page-title">Administración de Usuarios</h1>
          <p class="text-text-secondary text-sm">Gestiona todos los usuarios registrados en la plataforma</p>
        </div>
        <a routerLink="/app/admin/dashboard" class="btn-secondary">← Volver</a>
      </div>

      <div class="card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Usuario</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Email</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Rol</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Estado</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (user of users; track user.id) {
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="p-4">
                    <div class="font-medium text-text-primary">{{ user.name }}</div>
                    <div class="text-[10px] text-text-secondary">ID: {{ user.id }}</div>
                  </td>
                  <td class="p-4 text-sm text-text-secondary">{{ user.email }}</td>
                  <td class="p-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight"
                          [class]="user.role === 'admin_platform' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'">
                      {{ user.role === 'admin_platform' ? 'Admin' : 'Dueño' }}
                    </span>
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="user.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                      {{ user.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    @if (user.role !== 'admin_platform') {
                      <button (click)="toggleStatus(user)" 
                              class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border"
                              [class]="user.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'">
                        {{ user.is_active ? 'Desactivar' : 'Activar' }}
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination (simplified) -->
        <div class="p-4 border-t border-border flex justify-between items-center bg-gray-50/50">
          <span class="text-xs text-text-secondary">Página {{ currentPage }} de {{ lastPage }}</span>
          <div class="flex gap-2">
            <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage === 1" class="btn-secondary btn-xs">Anterior</button>
            <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage === lastPage" class="btn-secondary btn-xs">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  loading = true;
  currentPage = 1;
  lastPage = 1;

  constructor(private platformService: PlatformService) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading = true;
    this.platformService.getUsers(page).subscribe({
      next: (res) => {
        this.users = res.data.data;
        this.currentPage = res.data.current_page;
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  toggleStatus(user: any): void {
    if (confirm(`¿Estás seguro de que deseas ${user.is_active ? 'desactivar' : 'activar'} a ${user.name}?`)) {
      this.platformService.toggleUserStatus(user.id).subscribe({
        next: () => {
          user.is_active = !user.is_active;
        }
      });
    }
  }
}
