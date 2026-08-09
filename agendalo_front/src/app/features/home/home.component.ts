import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 text-text-primary flex flex-col">
      <header class="bg-white border-b border-border">
        <div class="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 py-5 sm:py-6 grid grid-cols-[auto_1fr_auto] items-center gap-5">
          <a routerLink="/" class="flex items-center">
            <img src="assets/Skedia%20Fondo%20Blanco.png" alt="Skedia" class="h-11 sm:h-12 w-auto max-w-[145px] sm:max-w-[180px] object-contain">
          </a>

          <nav class="hidden sm:flex items-center justify-center gap-10 text-base font-semibold text-text-secondary">
            <a routerLink="/" class="hover:text-primary transition-colors">Inicio</a>
            <a routerLink="/planes" class="hover:text-primary transition-colors">Planes</a>
          </nav>

          <nav class="flex items-center gap-3 text-base">
            <a routerLink="/login" class="btn-secondary px-4 py-2.5">Ingresar</a>
            <a routerLink="/registro" class="btn-primary px-4 py-2.5">Registrarse</a>
          </nav>
        </div>
      </header>

      <main class="flex-1">
        <section
          class="relative min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] flex items-center bg-slate-50 bg-no-repeat overflow-hidden"
          style="background-image: linear-gradient(90deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.88) 32%, rgba(248, 250, 252, 0.42) 52%, rgba(248, 250, 252, 0.06) 100%), url('assets/Hero.png'), radial-gradient(circle at 78% 42%, rgba(221, 232, 255, 0.9) 0%, rgba(237, 244, 255, 0.72) 34%, rgba(248, 250, 252, 0) 72%), linear-gradient(180deg, #f8fafc 0%, #eef5ff 52%, #f8fafc 100%); background-size: 100% 100%, auto 116%, 84% 100%, 100% 100%; background-position: center, 79% center, right center, center; background-repeat: no-repeat;"
        >
          <div class="max-w-[1440px] mx-auto w-full px-6 sm:px-10 lg:px-16 2xl:px-20 py-16 sm:py-20">
            <div class="max-w-xl space-y-7">
              <div class="space-y-4">
                <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight tracking-normal text-slate-900">
                  Gestiona reservas, clientes y servicios desde un solo lugar.
                </h1>
                <p class="text-base sm:text-lg text-text-secondary max-w-2xl">
                  Skedia te ayuda a organizar tu agenda, publicar una pagina de reservas y mantener el control diario de tu negocio.
                </p>
              </div>

              <div class="flex flex-col sm:flex-row gap-3">
                <a routerLink="/registro" class="btn-primary justify-center px-5 py-3">Crear cuenta</a>
                <a routerLink="/planes" class="btn-secondary justify-center px-5 py-3">Ver planes</a>
              </div>
            </div>
          </div>
        </section>

        <section class="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 pb-16 sm:pb-24">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p class="text-primary text-sm font-bold uppercase tracking-wider">Planes</p>
              <h2 class="text-3xl font-extrabold text-slate-900 mt-2">Elige como quieres empezar</h2>
              <p class="text-text-secondary mt-2 max-w-2xl">
                Parte con 14 dias gratis y escala cuando tu negocio necesite mas control, equipo o automatizacion.
              </p>
            </div>
            <a routerLink="/planes" class="btn-secondary justify-center">Ver detalle completo</a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            @for (plan of plans; track plan.name) {
              <article
                class="bg-white border rounded-lg shadow-card p-5 flex flex-col"
                [class.border-primary]="plan.featured"
                [class.ring-1]="plan.featured"
                [class.ring-primary]="plan.featured"
              >
                @if (plan.badge) {
                  <span class="self-start text-xs font-bold px-2.5 py-1 rounded-full bg-primary-light text-primary mb-4">
                    {{ plan.badge }}
                  </span>
                }
                <h3 class="text-lg font-bold text-slate-900">{{ plan.name }}</h3>
                <p class="text-sm text-text-secondary mt-1 min-h-10">{{ plan.description }}</p>
                <div class="mt-5">
                  <p class="text-3xl font-extrabold text-slate-900">{{ plan.price }}</p>
                  <p class="text-xs text-text-secondary mt-1">{{ plan.period }}</p>
                </div>
                <ul class="mt-5 space-y-2 text-sm text-text-secondary flex-1">
                  @for (feature of plan.features; track feature) {
                    <li class="flex gap-2">
                      <span class="text-primary font-bold">✓</span>
                      <span>{{ feature }}</span>
                    </li>
                  }
                </ul>
                <a
                  [routerLink]="plan.ctaLink"
                  class="mt-6 justify-center"
                  [class.btn-primary]="plan.featured"
                  [class.btn-secondary]="!plan.featured"
                >
                  {{ plan.cta }}
                </a>
              </article>
            }
          </div>
        </section>
      </main>

      <footer class="bg-white border-t border-border">
        <div class="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 py-5 flex flex-col sm:flex-row items-start justify-between gap-3 text-sm text-text-secondary">
          <div class="flex flex-col items-start gap-2">
            <img src="assets/Skedia%20Fondo%20Blanco.png" alt="Skedia" class="h-9 w-auto max-w-[140px] object-contain">
            <p>Plataforma de agendamiento</p>
            <div class="flex items-center gap-2 pt-1" aria-label="Redes sociales">
              <button type="button" class="w-9 h-9 rounded-full border border-blue-100 bg-primary-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="Instagram" aria-label="Instagram">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="2"/>
                  <circle cx="17" cy="7" r="1.2" fill="currentColor"/>
                </svg>
              </button>
              <button type="button" class="w-9 h-9 rounded-full border border-blue-100 bg-primary-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="Facebook" aria-label="Facebook">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M14.2 8.4V6.9c0-.7.5-1.1 1.2-1.1h1.8V3h-2.6c-2.8 0-4.2 1.6-4.2 4v1.4H8.3v3.1h2.1V21h3.8v-9.5h2.6l.5-3.1h-3.1z"/>
                </svg>
              </button>
              <button type="button" class="w-9 h-9 rounded-full border border-blue-100 bg-primary-light text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors" title="WhatsApp" aria-label="WhatsApp">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5.5 19.1l1-3A7.5 7.5 0 1 1 9 18.5l-3.5.6z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                  <path d="M9.4 8.8c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.5c.1.3.1.5-.1.7l-.4.5c.6 1.1 1.4 1.9 2.5 2.5l.5-.4c.2-.2.5-.2.7-.1l1.5.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.7-.7.3-1.7.2-2.8-.3-1.5-.7-2.8-1.8-3.7-3.2-.8-1.2-1.2-2.6-.9-3.5z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/planes" class="hover:text-primary">Planes</a>
            <a routerLink="/login" class="hover:text-primary">Ingresar</a>
            <a routerLink="/registro" class="hover:text-primary">Crear cuenta</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class HomeComponent {
  plans = [
    {
      name: '14 dias gratis',
      description: 'Prueba Skedia sin compromiso y valida si calza con tu negocio.',
      price: '$0',
      period: 'por 14 dias',
      badge: 'Para empezar',
      cta: 'Probar gratis',
      ctaLink: '/registro',
      featured: false,
      features: ['Agenda y reservas publicas', 'Servicios y clientes', 'Dashboard basico'],
    },
    {
      name: 'Basico',
      description: 'Para negocios pequenos que necesitan ordenar reservas y clientes.',
      price: '$9.990',
      period: 'CLP / mes',
      badge: '',
      cta: 'Elegir Basico',
      ctaLink: '/registro',
      featured: false,
      features: ['1 negocio', 'Agenda mensual/semanal', 'Pagina publica de reservas'],
    },
    {
      name: 'Medio',
      description: 'Para negocios con mas movimiento y control financiero diario.',
      price: '$19.990',
      period: 'CLP / mes',
      badge: 'Recomendado',
      cta: 'Elegir Medio',
      ctaLink: '/registro',
      featured: true,
      features: ['Todo Basico', 'Finanzas e insumos', 'Reportes de rendimiento'],
    },
    {
      name: 'Premium',
      description: 'Para equipos que necesitan automatizacion, soporte y escalabilidad.',
      price: '$34.990',
      period: 'CLP / mes',
      badge: 'Completo',
      cta: 'Elegir Premium',
      ctaLink: '/registro',
      featured: false,
      features: ['Todo Medio', 'Google Calendar', 'Soporte prioritario'],
    },
  ];
}
