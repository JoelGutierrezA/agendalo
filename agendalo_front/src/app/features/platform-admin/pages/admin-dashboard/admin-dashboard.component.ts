import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiResponse } from '../../../../models/auth.models';
import { PlatformService } from '../../services/platform.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto p-6">
      <div class="page-header">
        <div>
          <h1 class="page-title">Panel de Administración Global</h1>
          <p class="text-text-secondary text-sm">Resumen de la plataforma Agéndalo</p>
        </div>
        <div class="flex gap-2">
            <button class="btn-secondary" (click)="loadStats()">🔄 Recargar</button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-5 border-l-4 border-primary relative overflow-hidden">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Negocios</p>
          <div class="flex items-baseline gap-2">
            @if (loading) {
              <div class="skeleton h-8 w-16 mt-1"></div>
            } @else {
              <p class="text-2xl font-bold mt-1 text-text-primary fade-in">{{ stats?.total_businesses ?? 0 }}</p>
            }
          </div>
          @if (loading) {
            <div class="skeleton-text w-20 h-3 mt-2"></div>
          } @else {
            <p class="text-[11px] text-green-600 font-medium mt-1 fade-in">{{ stats?.active_businesses ?? 0 }} activos</p>
          }
        </div>

        <div class="card p-5 border-l-4 border-blue-500 relative overflow-hidden">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Usuarios</p>
          @if (loading) {
            <div class="skeleton h-8 w-16 mt-1"></div>
          } @else {
            <p class="text-2xl font-bold mt-1 text-text-primary fade-in">{{ stats?.total_users ?? 0 }}</p>
          }
        </div>

        <div class="card p-5 border-l-4 border-purple-500 relative overflow-hidden">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Citas</p>
          @if (loading) {
            <div class="skeleton h-8 w-16 mt-1"></div>
          } @else {
            <p class="text-2xl font-bold mt-1 text-text-primary fade-in">{{ stats?.total_appointments ?? 0 }}</p>
          }
        </div>

        <div class="card p-5 border-l-4 border-amber-500 relative overflow-hidden">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Estado Sistema</p>
          <p class="text-2xl font-bold mt-1 text-text-primary uppercase text-sm">Operativo</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card cursor-pointer hover:shadow-lg transition-all" routerLink="/admin-plataforma/negocios">
          <div class="p-8 text-center">
            <span class="text-5xl mb-4 block">🏢</span>
            <h3 class="font-bold text-xl mb-2">Gestionar Negocios</h3>
            <p class="text-text-secondary text-sm">Ver, activar o desactivar negocios registrados en la plataforma.</p>
          </div>
        </div>

        <div class="card cursor-pointer hover:shadow-lg transition-all" routerLink="/admin-plataforma/usuarios">
          <div class="p-8 text-center">
            <span class="text-5xl mb-4 block">👥</span>
            <h3 class="font-bold text-xl mb-2">Gestionar Usuarios</h3>
            <p class="text-text-secondary text-sm">Administrar cuentas de usuarios, dueños de negocio y administradores.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  stats: any = null;
  loading = true;

  constructor(private platformService: PlatformService) { }

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.platformService.getStats().subscribe({
      next: (res: ApiResponse<any>) => {
        this.stats = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
