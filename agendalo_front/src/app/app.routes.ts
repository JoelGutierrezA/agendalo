import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { businessSetupGuard } from './core/guards/business-setup.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Skedia'
  },

  // === Rutas Públicas (clientes finales) ===
  {
    path: 'negocio',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        m => m.PublicLayoutComponent
      ),
    children: [
      {
        path: ':slug',
        loadComponent: () =>
          import('./features/public-booking/pages/booking-page/booking-page.component').then(
            m => m.BookingPageComponent
          ),
        title: 'Reservar Cita'
      },
      {
        path: ':slug/confirmacion',
        loadComponent: () =>
          import('./features/public-booking/pages/booking-confirmation/booking-confirmation.component').then(
            m => m.BookingConfirmationComponent
          ),
        title: 'Reserva Confirmada'
      },
    ]
  },

  // === Rutas de Autenticación ===
  {
    path: '',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
        title: 'Iniciar Sesión — Skedia'
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent),
        title: 'Crear cuenta — Skedia'
      },
      {
        path: 'recuperar-contrasena',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            m => m.ForgotPasswordComponent
          ),
        title: 'Recuperar contraseña — Skedia'
      },
      {
        path: 'restablecer-contrasena',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password.component').then(
            m => m.ResetPasswordComponent
          ),
        title: 'Nueva contraseña — Skedia'
      },
    ]
  },

  // === Onboarding (usuario autenticado sin negocio) ===
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/onboarding/onboarding.component').then(
        m => m.OnboardingComponent
      ),
    title: 'Configura tu negocio — Skedia'
  },

  // === Panel Administrativo (dueño del negocio) ===
  {
    path: 'app',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        m => m.AdminLayoutComponent
      ),
    canActivate: [authGuard, businessSetupGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          ),
        title: 'Dashboard — Skedia'
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('./features/appointments/pages/calendar/calendar.component').then(
            m => m.CalendarComponent
          ),
        title: 'Agenda — Skedia'
      },
      {
        path: 'citas',
        loadComponent: () =>
          import('./features/appointments/pages/appointments-list/appointments-list.component').then(
            m => m.AppointmentsListComponent
          ),
        title: 'Citas — Skedia'
      },
      {
        path: 'citas/nueva',
        loadComponent: () =>
          import('./features/appointments/pages/appointment-form/appointment-form.component').then(
            m => m.AppointmentFormComponent
          ),
        title: 'Nueva Cita — Skedia'
      },
      {
        path: 'citas/:id/editar',
        loadComponent: () =>
          import('./features/appointments/pages/appointment-form/appointment-form.component').then(
            m => m.AppointmentFormComponent
          ),
        title: 'Editar Cita — Skedia'
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clients/pages/clients-list/clients-list.component').then(
            m => m.ClientsListComponent
          ),
        title: 'Clientes — Skedia'
      },
      {
        path: 'clientes/:id',
        loadComponent: () =>
          import('./features/clients/pages/client-detail/client-detail.component').then(
            m => m.ClientDetailComponent
          ),
        title: 'Perfil de Cliente — Skedia'
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./features/services/pages/services-list/services-list.component').then(
            m => m.ServicesListComponent
          ),
        title: 'Servicios — Skedia'
      },
      {
        path: 'finanzas',
        loadComponent: () =>
          import('./features/finance/pages/finance/finance.component').then(
            m => m.FinanceComponent
          ),
        title: 'Finanzas — Skedia'
      },
      {
        path: 'insumos',
        loadComponent: () =>
          import('./features/finance/pages/supplies/supplies.component').then(
            m => m.SuppliesComponent
          ),
        title: 'Insumos y Compras — Skedia'
      },
      {
        path: 'configuracion',
        loadComponent: () =>
          import('./features/settings/pages/settings/settings.component').then(
            m => m.SettingsComponent
          ),
        title: 'Configuración — Skedia'
      },
    ]
  },

  // === Admin de Plataforma (solo para platform_admins) ===
  {
    path: 'admin-plataforma',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        m => m.AdminLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/platform-admin/pages/admin-dashboard/admin-dashboard.component').then(
            m => m.AdminDashboardComponent
          ),
        title: 'Dashboard Admin — Skedia'
      },
      {
        path: 'negocios',
        loadComponent: () =>
          import('./features/platform-admin/pages/business-list/business-list.component').then(
            m => m.BusinessListComponent
          ),
        title: 'Negocios — Skedia'
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/platform-admin/pages/user-list/user-list.component').then(
            m => m.UserListComponent
          ),
        title: 'Usuarios — Skedia'
      }
    ]
  },

  // === Redirects ===
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        m => m.NotFoundComponent
      ),
    title: 'Página no encontrada — Skedia'
  },
];
