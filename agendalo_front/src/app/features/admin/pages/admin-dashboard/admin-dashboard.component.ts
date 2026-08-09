import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/common/router';
import { PlatformService } from '../../services/platform.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <div class="page-header">
        <div>
          <h1 class="page-title">Panel de Administración Global</h1>
          <p class="text-text-secondary text-sm">Resumen de la plataforma Agéndalo</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card p-5 border-l-4 border-primary">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Negocios</p>
          <p class="text-2xl font-bold mt-1 text-text-primary">{{ stats?.total_businesses || 0 }}</p>
          <p class="text-[11px] text-green-600 font-medium mt-1">{{ stats?.active_businesses || 0 }} activos</p>
        </div>

        <div class="card p-5 border-l-4 border-blue-500">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Usuarios</p>
          <p class="text-2xl font-bold mt-1 text-text-primary">{{ stats?.total_users || 0 }}</p>
        </div>

        <div class="card p-5 border-l-4 border-purple-500">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Total Citas</p>
          <p class="text-2xl font-bold mt-1 text-text-primary">{{ stats?.total_appointments || 0 }}</p>
        </div>

        <div class="card p-5 border-l-4 border-amber-500">
          <p class="text-text-secondary text-xs font-bold uppercase tracking-wider">Estado Sistema</p>
          <p class="text-2xl font-bold mt-1 text-text-primary">Operativo</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card cursor-pointer hover:shadow-lg transition-all" routerLink="/app/admin/negocios">
          <div class="p-6 text-center">
            <span class="text-4xl mb-4 block">🏢</span>
            <h3 class="font-bold text-lg mb-2">Gestionar Negocios</h3>
            <p class="text-text-secondary text-sm">Ver, activar o desactivar negocios registrados en la plataforma.</p>
          </div>
        </div>

        <div class="card cursor-pointer hover:shadow-lg transition-all" routerLink="/app/admin/usuarios">
          <div class="p-6 text-center">
            <span class="text-4xl mb-4 block">👥</span>
            <h3 class="font-bold text-lg mb-2">Gestionar Usuarios</h3>
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

  constructor(private platformService: PlatformService) {}

  ngOnInit(): void {
    this.platformService.getStats().subscribe({
      next: (res) => {
        this.stats = res.data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
