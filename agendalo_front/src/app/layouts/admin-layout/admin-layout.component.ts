import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../features/settings/services/business.service';

interface NavItem {
  label: string;
  route: string;
  iconPath?: string;
  icon?: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-background">

      <!-- Sidebar desktop -->
      <aside class="hidden lg:flex flex-col w-60 bg-[#000A21] flex-shrink-0">
        <div class="flex items-center px-5 py-5 border-b border-white/10 h-20 bg-[#000A21]">
          <img src="assets/Skedia%20Fondo%20Oscuro.png" alt="Skedia" class="h-11 w-auto max-w-[170px] object-contain">
        </div>

        <div class="px-5 py-4 border-b border-white/10">
          <p class="text-[13px] text-sidebar-text uppercase tracking-wider mb-1.5">Tu negocio</p>
          <p class="text-white text-base font-semibold truncate">{{ businessName() }}</p>
        </div>

        <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          @for (item of navItems(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/admin-plataforma' }"
              class="sidebar-link"
            >
              @if (item.iconPath) {
                <span class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img [src]="item.iconPath" alt="" class="w-9 h-9 object-cover" aria-hidden="true">
                </span>
              } @else {
                <span class="text-xl">{{ item.icon }}</span>
              }
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="px-3 py-4 border-t border-white/10">
          <div class="flex items-center gap-3 px-5 py-2.5 mb-1">
            <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {{ userInitial() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-base font-semibold truncate">{{ userName() }}</p>
              <p class="text-sidebar-text text-sm truncate">{{ userEmail() }}</p>
            </div>
          </div>
          <button type="button" (click)="doLogout()" class="sidebar-link w-full">
            <span class="text-xl">↩</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <!-- Sidebar móvil -->
      @if (mobileMenuOpen()) {
        <div class="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            class="absolute inset-0 bg-slate-950/50"
            aria-label="Cerrar menú"
            (click)="closeMobileMenu()"
          ></button>

          <aside class="relative z-10 flex h-full w-72 max-w-[84vw] flex-col bg-[#000A21] shadow-2xl">
            <div class="flex items-center justify-between px-5 py-5 border-b border-white/10 h-20 bg-[#000A21]">
              <img src="assets/Skedia%20Fondo%20Oscuro.png" alt="Skedia" class="h-11 w-auto max-w-[170px] object-contain">
              <button
                type="button"
                class="w-10 h-10 rounded-xl text-white hover:bg-white/10 transition-colors"
                aria-label="Cerrar menú"
                (click)="closeMobileMenu()"
              >
                ×
              </button>
            </div>

            <div class="px-5 py-4 border-b border-white/10">
              <p class="text-[13px] text-sidebar-text uppercase tracking-wider mb-1.5">Tu negocio</p>
              <p class="text-white text-base font-semibold truncate">{{ businessName() }}</p>
            </div>

            <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              @for (item of navItems(); track item.route) {
                <a
                  [routerLink]="item.route"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.route === '/admin-plataforma' }"
                  class="sidebar-link"
                  (click)="closeMobileMenu()"
                >
                  @if (item.iconPath) {
                    <span class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img [src]="item.iconPath" alt="" class="w-9 h-9 object-cover" aria-hidden="true">
                    </span>
                  } @else {
                    <span class="text-xl">{{ item.icon }}</span>
                  }
                  <span>{{ item.label }}</span>
                </a>
              }
            </nav>

            <div class="px-3 py-4 border-t border-white/10">
              <div class="flex items-center gap-3 px-5 py-2.5 mb-1">
                <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {{ userInitial() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-white text-base font-semibold truncate">{{ userName() }}</p>
                  <p class="text-sidebar-text text-sm truncate">{{ userEmail() }}</p>
                </div>
              </div>
              <button type="button" (click)="doLogout()" class="sidebar-link w-full">
                <span class="text-xl">↩</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </aside>
        </div>
      }

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header class="bg-surface border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            class="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Abrir menú"
            (click)="toggleMobileMenu()"
          >
            <span class="text-xl">☰</span>
          </button>
          <div class="hidden lg:block" aria-hidden="true"></div>

          <div class="hidden sm:flex items-center gap-2">
            <a
              [href]="publicUrl()"
              target="_blank"
              class="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-white text-sm font-medium text-text-primary hover:border-primary/40 hover:text-primary transition-colors"
              title="Ver página pública"
            >
              <span>↗</span>
              <span>Ver página</span>
            </a>

            <button
              type="button"
              class="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-white text-sm font-medium text-text-primary hover:border-primary/40 hover:text-primary transition-colors"
              (click)="copyPublicUrl()"
            >
              <span>{{ copyLabel() }}</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-border bg-white text-sm font-medium text-text-primary hover:border-primary/40 hover:text-primary transition-colors"
              (click)="openQrModal()"
            >
              <span>Generar QR</span>
            </button>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto p-6">
          <router-outlet />
        </main>
      </div>

      @if (qrModalOpen()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <button
            type="button"
            class="absolute inset-0"
            aria-label="Cerrar QR"
            (click)="closeQrModal()"
          ></button>

          <div class="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div class="flex items-center justify-between gap-4 mb-5">
              <h2 class="text-lg font-bold text-text-primary">QR para tomar citas</h2>
              <button
                type="button"
                class="w-9 h-9 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-gray-50"
                aria-label="Cerrar QR"
                (click)="closeQrModal()"
              >
                ×
              </button>
            </div>

            <div class="mx-auto relative w-72 h-72 max-w-full rounded-2xl border border-border bg-white p-4">
              <img [src]="qrImageUrl()" alt="QR para tomar citas" class="w-full h-full object-contain">
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="w-16 h-16 rounded-2xl bg-white shadow-lg border border-border flex items-center justify-center p-2">
                  <img src="assets/Icono%20Skedia%201.png" alt="Skedia" class="w-full h-full object-contain rounded-xl">
                </div>
              </div>
            </div>

            <p class="mt-4 text-sm text-text-secondary break-all">{{ publicUrl() }}</p>
            <button type="button" class="btn-primary w-full justify-center mt-5" (click)="copyPublicUrl()">
              Copiar enlace
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminLayoutComponent {
  mobileMenuOpen = signal(false);
  qrModalOpen = signal(false);
  copyLabel = signal('Copiar enlace');

  navItems = computed<NavItem[]>(() => {
    const role = this.authService.currentUser()?.role;

    if (role === 'admin_platform') {
      return [
        { label: 'Dashboard Admin', iconPath: 'assets/Interfaz/Dashboard.png', route: '/admin-plataforma' },
        { label: 'Negocios', iconPath: 'assets/Interfaz/Servicios.png', route: '/admin-plataforma/negocios' },
        { label: 'Usuarios', iconPath: 'assets/Interfaz/Clientes.png', route: '/admin-plataforma/usuarios' },
        { label: 'Configuración', iconPath: 'assets/Interfaz/Configuraci%C3%B3n.png', route: '/app/configuracion' },
      ];
    }

    return [
      { label: 'Finanzas', iconPath: 'assets/Interfaz/Dashboard.png', route: '/app/dashboard' },
      { label: 'Agenda', iconPath: 'assets/Interfaz/Agenda.png', route: '/app/agenda' },
      { label: 'Citas', iconPath: 'assets/Interfaz/Citas.png', route: '/app/citas' },
      { label: 'Clientes', iconPath: 'assets/Interfaz/Clientes.png', route: '/app/clientes' },
      { label: 'Servicios', iconPath: 'assets/Interfaz/Servicios.png', route: '/app/servicios' },
      { label: 'Insumos', iconPath: 'assets/Interfaz/Insumos.png', route: '/app/insumos' },
      { label: 'Suscripcion', iconPath: 'assets/Interfaz/Finanzas.png', route: '/app/suscripcion' },
      { label: 'Configuración', iconPath: 'assets/Interfaz/Configuraci%C3%B3n.png', route: '/app/configuracion' },
    ];
  });

  userName = computed(() => this.authService.currentUser()?.name ?? '');
  userEmail = computed(() => this.authService.currentUser()?.email ?? '');
  userInitial = computed(() => (this.authService.currentUser()?.name ?? 'U')[0].toUpperCase());
  businessName = computed(() => {
    const user = this.authService.currentUser();
    if (user?.role === 'admin_platform') return 'Administración';
    return this.businessService.currentBusiness()?.name ?? 'Mi Negocio';
  });
  publicPath = computed(() => {
    const slug = this.businessService.currentBusiness()?.slug;
    return slug ? `/negocio/${slug}` : '#';
  });
  publicUrl = computed(() => {
    if (this.publicPath() === '#') return '#';
    return `${window.location.origin}${this.publicPath()}`;
  });
  qrImageUrl = computed(() => {
    const encodedUrl = encodeURIComponent(this.publicUrl());
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=18&data=${encodedUrl}`;
  });

  constructor(
    private authService: AuthService,
    private businessService: BusinessService,
    private router: Router
  ) {}

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  async copyPublicUrl(): Promise<void> {
    if (this.publicUrl() === '#') return;

    try {
      await navigator.clipboard.writeText(this.publicUrl());
      this.copyLabel.set('Copiado');
      setTimeout(() => this.copyLabel.set('Copiar enlace'), 1800);
    } catch {
      this.copyLabel.set('No se pudo copiar');
      setTimeout(() => this.copyLabel.set('Copiar enlace'), 1800);
    }
  }

  openQrModal(): void {
    if (this.publicUrl() === '#') return;
    this.qrModalOpen.set(true);
  }

  closeQrModal(): void {
    this.qrModalOpen.set(false);
  }

  doLogout(): void {
    this.closeMobileMenu();
    this.authService.logout().subscribe({
      complete: () => {
        this.businessService.clearBusiness();
        this.router.navigate(['/login']);
      }
    });
  }
}
