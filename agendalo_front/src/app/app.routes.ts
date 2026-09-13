import { Routes } from '@angular/router';
import { adminPlatformGuard } from './core/guards/admin-platform.guard';
import { authGuard } from './core/guards/auth.guard';
import { businessSetupGuard } from './core/guards/business-setup.guard';
import { featureGuard } from './core/guards/feature.guard';
import { guestGuard } from './core/guards/guest.guard';
import { subscriptionAccessGuard } from './core/guards/subscription-access.guard';

export const routes: Routes = [
  {
    path: 'planes',
    loadComponent: () =>
      import('./features/plans/plans.component').then(m => m.PlansComponent),
    title: 'Planes - Skedia',
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then(m => m.HomeComponent),
    title: 'Skedia',
  },

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
        title: 'Reservar Cita',
      },
      {
        path: ':slug/confirmacion',
        loadComponent: () =>
          import('./features/public-booking/pages/booking-confirmation/booking-confirmation.component').then(
            m => m.BookingConfirmationComponent
          ),
        title: 'Reserva Confirmada',
      },
    ],
  },

  {
    path: '',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
        title: 'Iniciar Sesion - Skedia',
      },
      {
        path: 'registro',
        loadComponent: () =>
          import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent),
        title: 'Crear cuenta - Skedia',
      },
      {
        path: 'recuperar-contrasena',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password.component').then(
            m => m.ForgotPasswordComponent
          ),
        title: 'Recuperar contrasena - Skedia',
      },
      {
        path: 'restablecer-contrasena',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password.component').then(
            m => m.ResetPasswordComponent
          ),
        title: 'Nueva contrasena - Skedia',
      },
    ],
  },

  {
    path: 'onboarding',
    redirectTo: 'app/configuracion/negocio',
    pathMatch: 'full',
  },

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
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard.component').then(
            m => m.DashboardComponent
          ),
        title: 'Dashboard - Skedia',
      },
      {
        path: 'agenda',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/appointments/pages/calendar/calendar.component').then(
            m => m.CalendarComponent
          ),
        title: 'Agenda - Skedia',
      },
      {
        path: 'citas/nueva',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/appointments/pages/appointment-form/appointment-form.component').then(
            m => m.AppointmentFormComponent
          ),
        title: 'Nueva Cita - Skedia',
      },
      {
        path: 'citas/:id/editar',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/appointments/pages/appointment-form/appointment-form.component').then(
            m => m.AppointmentFormComponent
          ),
        title: 'Editar Cita - Skedia',
      },
      {
        path: 'clientes',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/clients/pages/clients-list/clients-list.component').then(
            m => m.ClientsListComponent
          ),
        title: 'Clientes - Skedia',
      },
      {
        path: 'clientes/:id',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/clients/pages/client-detail/client-detail.component').then(
            m => m.ClientDetailComponent
          ),
        title: 'Perfil de Cliente - Skedia',
      },
      {
        path: 'servicios',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/services/pages/services-list/services-list.component').then(
            m => m.ServicesListComponent
          ),
        title: 'Servicios - Skedia',
      },
      {
        path: 'suscripcion',
        loadComponent: () =>
          import('./features/subscription/pages/subscription/subscription.component').then(
            m => m.SubscriptionComponent
          ),
        title: 'Suscripcion - Skedia',
      },
      {
        path: 'configuracion/negocio',
        loadComponent: () =>
          import('./features/auth/pages/onboarding/onboarding.component').then(
            m => m.OnboardingComponent
          ),
        title: 'Configura tu negocio - Skedia',
      },
      {
        path: 'insumos',
        canActivate: [subscriptionAccessGuard, featureGuard],
        data: { feature: 'supplies' },
        loadComponent: () =>
          import('./features/finance/pages/supplies/supplies.component').then(
            m => m.SuppliesComponent
          ),
        title: 'Insumos y Compras - Skedia',
      },
      {
        path: 'configuracion',
        canActivate: [subscriptionAccessGuard],
        loadComponent: () =>
          import('./features/settings/pages/settings/settings.component').then(
            m => m.SettingsComponent
          ),
        title: 'Configuracion - Skedia',
      },
    ],
  },

  {
    path: 'admin-plataforma',
    canActivate: [authGuard, adminPlatformGuard],
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
        title: 'Dashboard Admin - Skedia',
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/platform-admin/pages/user-list/user-list.component').then(
            m => m.UserListComponent
          ),
        title: 'Usuarios - Skedia',
      },
      {
        path: 'solicitudes',
        loadComponent: () =>
          import('./features/platform-admin/pages/request-list/request-list.component').then(
            m => m.RequestListComponent
          ),
        title: 'Solicitudes - Skedia',
      },
    ],
  },

  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        m => m.NotFoundComponent
      ),
    title: 'Pagina no encontrada - Skedia',
  },
];
