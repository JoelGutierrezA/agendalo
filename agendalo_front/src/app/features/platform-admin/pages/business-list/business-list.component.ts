import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PlatformService } from '../../services/platform.service';
import { ApiResponse } from '../../../../models/auth.models';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-business-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto p-6">
      <div class="page-header">
        <div>
          <h1 class="page-title">Administración de Negocios</h1>
          <p class="text-text-secondary text-sm">Gestiona todos los negocios registrados en Agéndalo</p>
        </div>
        <a routerLink="/admin-plataforma" class="btn-secondary">← Volver</a>
      </div>

      <div class="card p-0 overflow-hidden">
        <div class="overflow-x-auto text-sm">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50 border-b border-border">
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Negocio</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Dueño</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Ubicación</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider">Estado</th>
                <th class="p-4 font-bold uppercase text-text-secondary tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @if (loading) {
                @for (i of [1,2,3,4,5]; track i) {
                  <tr>
                    <td class="p-4"><div class="skeleton-text w-32 h-4"></div><div class="skeleton-text w-20 h-2 mt-2"></div></td>
                    <td class="p-4"><div class="skeleton-text w-24 h-4"></div><div class="skeleton-text w-28 h-2 mt-2"></div></td>
                    <td class="p-4"><div class="skeleton-text w-32 h-3"></div></td>
                    <td class="p-4"><div class="skeleton w-20 h-6 rounded-lg"></div></td>
                    <td class="p-4 text-right"><div class="skeleton w-24 h-8 rounded-xl ml-auto"></div></td>
                  </tr>
                }
              } @else {
                @for (biz of businesses; track biz.id) {
                  <tr class="hover:bg-gray-50/50 transition-colors fade-in">
                    <td class="p-4">
                      <div class="font-bold text-base text-text-primary">{{ biz.name }}</div>
                      <div class="text-[10px] text-text-secondary italic">slug: {{ biz.slug }}</div>
                    </td>
                    <td class="p-4">
                      <div class="font-medium text-text-primary">{{ biz.owner?.name || 'Sistema' }}</div>
                      <div class="text-[10px] text-text-secondary">{{ biz.owner?.email }}</div>
                    </td>
                    <td class="p-4 text-text-secondary">
                      {{ biz.city }}{{ biz.city ? ', ' : '' }}{{ biz.country }}
                    </td>
                    <td class="p-4">
                      <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold"
                            [class]="biz.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                        <span class="w-2 h-2 rounded-full" [class]="biz.is_active ? 'bg-green-500' : 'bg-red-500'"></span>
                        {{ biz.is_active ? 'Activo' : 'Inactivo' }}
                      </span>
                    </td>
                    <td class="p-4 text-right">
                      <button (click)="toggleStatus(biz)" 
                              class="text-[11px] font-bold px-4 py-2 rounded-xl transition-all border uppercase"
                              [class]="biz.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'">
                        {{ biz.is_active ? 'Suspender' : 'Reactivar' }}
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
          @if (businesses.length === 0 && !loading) {
            <app-empty-state
              icon="🏢"
              title="No hay negocios registrados"
              description="Aún no se han registrado negocios en la plataforma."
            ></app-empty-state>
          }
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-border flex justify-between items-center bg-gray-50/30">
          <span class="text-xs font-medium text-text-secondary">Página {{ currentPage }} de {{ lastPage }}</span>
          <div class="flex gap-2">
            <button (click)="loadPage(currentPage - 1)" [disabled]="currentPage === 1" class="btn-secondary btn-sm px-4">Anterior</button>
            <button (click)="loadPage(currentPage + 1)" [disabled]="currentPage === lastPage" class="btn-secondary btn-sm px-4">Siguiente</button>
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
      next: (res: ApiResponse<any>) => {
        this.businesses = res.data.data;
        this.currentPage = res.data.current_page;
        this.lastPage = res.data.last_page;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  toggleStatus(biz: any): void {
    const action = biz.is_active ? 'suspender' : 'reactivar';
    if (confirm(`¿Estás seguro de que deseas ${action} el negocio "${biz.name}"?`)) {
      this.platformService.toggleBusinessStatus(biz.id).subscribe({
        next: () => {
          biz.is_active = !biz.is_active;
        }
      });
    }
  }
}
