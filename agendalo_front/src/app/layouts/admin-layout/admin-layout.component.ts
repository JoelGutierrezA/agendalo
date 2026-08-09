import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../features/settings/services/business.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">

      <!-- Sidebar -->
      <aside class="hidden lg:flex flex-col w-60 bg-sidebar-bg flex-shrink-0">
        <!-- Logo -->
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/10 h-20">
          <img src="assets/Skedia_sf.png" alt="Skedia" class="h-9 w-9 object-contain">
          <span class="text-white text-xl font-semibold tracking-tight">Skedia</span>
        </div>

        <!-- Nombre del negocio -->
        <div class="px-5 py-3 border-b border-white/10">
          <p class="text-xs text-sidebar-text uppercase tracking-wider mb-1">Tu negocio</p>
          <p class="text-white text-sm font-medium truncate">{{ businessName() }}</p>
        </div>

        <!-- Navegación -->
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          @for (item of navItems(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/admin-plataforma' }"
              class="sidebar-link"
            >
              <span class="text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Usuario y logout -->
        <div class="px-3 py-4 border-t border-white/10">
          <div class="flex items-center gap-3 px-4 py-2 mb-1">
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ userName() }}</p>
              <p class="text-sidebar-text text-xs truncate">{{ userEmail() }}</p>
            </div>
          </div>
          <button (click)="doLogout()" class="sidebar-link w-full">
            <span>↩️</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Topbar -->
        <header class="bg-surface border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <!-- Mobile menu button (placeholder) -->
          <button class="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <span class="text-xl">☰</span>
          </button>
          <div class="hidden lg:block" aria-hidden="true"></div>

          <div class="flex items-center gap-3">
            <!-- Link página pública -->
            <a
              [href]="publicUrl()"
              target="_blank"
              class="hidden sm:flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
              title="Ver página pública"
            >
              <span>🔗</span>
              <span>Ver página</span>
            </a>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {
  navItems = computed(() => {
    const role = this.authService.currentUser()?.role;
    
    if (role === 'admin_platform') {
      return [
        { label: 'Dashboard Admin', icon: '🚀', route: '/admin-plataforma' },
        { label: 'Negocios',        icon: '🏢', route: '/admin-plataforma/negocios' },
        { label: 'Usuarios',        icon: '👥', route: '/admin-plataforma/usuarios' },
        { label: 'Configuración',   icon: '⚙️',  route: '/app/configuracion' },
      ];
    }

    return [
      { label: 'Dashboard',    icon: '📊', route: '/app/dashboard' },
      { label: 'Agenda',       icon: '📅', route: '/app/agenda' },
      { label: 'Citas',        icon: '📋', route: '/app/citas' },
      { label: 'Clientes',     icon: '👥', route: '/app/clientes' },
      { label: 'Servicios',    icon: '🛠️',  route: '/app/servicios' },
      { label: 'Insumos',      icon: '📦', route: '/app/insumos' },
      { label: 'Finanzas',     icon: '💰', route: '/app/finanzas' },
      { label: 'Configuración',icon: '⚙️',  route: '/app/configuracion' },
    ];
  });

  userName    = computed(() => this.authService.currentUser()?.name ?? '');
  userEmail   = computed(() => this.authService.currentUser()?.email ?? '');
  userInitial = computed(() => (this.authService.currentUser()?.name ?? 'U')[0].toUpperCase());
  businessName = computed(() => {
    const user = this.authService.currentUser();
    if (user?.role === 'admin_platform') return 'Administración';
    return this.businessService.currentBusiness()?.name ?? 'Mi Negocio';
  });
  publicUrl   = computed(() => {
    const slug = this.businessService.currentBusiness()?.slug;
    return slug ? `/negocio/${slug}` : '#';
  });

  constructor(
    private authService: AuthService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  doLogout(): void {
    this.authService.logout().subscribe({
      complete: () => {
        this.businessService.clearBusiness();
        this.router.navigate(['/login']);
      }
    });
  }
}
