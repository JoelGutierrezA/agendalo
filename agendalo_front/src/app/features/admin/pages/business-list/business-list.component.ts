import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlatformService } from '../../services/platform.service';

@Component({
  selector: 'app-business-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <div>
          <h1 class="page-title">Administración de Negocios</h1>
          <p class="text-text-secondary text-sm">Gestiona todos los negocios registrados en Agéndalo</p>
        </div>
        <a routerLink="/app/admin/dashboard" class="btn-secondary">← Volver</a>
      </div>

      <div class="card p-0 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Negocio</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Dueño</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Ubicación</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider">Estado</th>
                <th class="p-4 text-xs font-bold uppercase text-text-secondary tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (biz of businesses; track biz.id) {
                <tr class="hover:bg-gray-50/50 transition-colors">
                  <td class="p-4">
                    <div class="font-bold text-text-primary">{{ biz.name }}</div>
                    <div class="text-[10px] text-text-secondary">Slug: {{ biz.slug }}</div>
                  </td>
                  <td class="p-4">
                    <div class="text-sm font-medium text-text-primary">{{ biz.owner?.name || 'N/A' }}</div>
                    <div class="text-[10px] text-text-secondary">{{ biz.owner?.email }}</div>
                  </td>
                  <td class="p-4 text-sm text-text-secondary">
                    {{ biz.city }}, {{ biz.country }}
                  </td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="biz.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                      <span class="w-1.5 h-1.5 rounded-full" [class]="biz.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                      {{ biz.is_active ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    <button (click)="toggleStatus(biz)" 
                            class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border"
                            [class]="biz.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'">
                      {{ biz.is_active ? 'Desactivar' : 'Activar' }}
                    </button>
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
export class BusinessListComponent implements OnInit {
  businesses: any[] = [];
  loading = true;
  currentPage = 1;
  lastPage = 1;

  constructor(private platformService: PlatformService) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.loading = true;
    this.platformService.getBusinesses(page).subscribe({
      next: (res) => {
        this.businesses = res.data.data;
        this.currentPage = res.data.current_page;
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  toggleStatus(biz: any): void {
    const action = biz.is_active ? 'desactivar' : 'activar';
    if (confirm(`¿Estás seguro de que deseas ${action} el negocio "${biz.name}"? Esto afectará su página pública.`)) {
      this.platformService.toggleBusinessStatus(biz.id).subscribe({
        next: () => {
          biz.is_active = !biz.is_active;
        }
      });
    }
  }
}
