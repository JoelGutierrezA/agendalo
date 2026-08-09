import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-50 text-text-primary flex flex-col">
      <header class="bg-white border-b border-border">
        <div class="max-w-6xl mx-auto px-5 py-5 sm:py-6 grid grid-cols-[auto_1fr_auto] items-center gap-5">
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
        <section class="max-w-6xl mx-auto px-5 py-14 sm:py-20">
          <div class="max-w-3xl">
            <p class="text-primary text-sm font-bold uppercase tracking-wider">Planes Skedia</p>
            <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-3 leading-tight">
              Un plan para cada etapa de tu negocio.
            </h1>
            <p class="text-text-secondary text-lg mt-4">
              Empieza gratis por 14 dias y sube de plan cuando necesites mas capacidad, control financiero o automatizacion.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-10">
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
                <h2 class="text-xl font-bold text-slate-900">{{ plan.name }}</h2>
                <p class="text-sm text-text-secondary mt-2 min-h-12">{{ plan.description }}</p>
                <div class="mt-5">
                  <p class="text-3xl font-extrabold text-slate-900">{{ plan.price }}</p>
                  <p class="text-xs text-text-secondary mt-1">{{ plan.period }}</p>
                </div>

                <div class="mt-6 space-y-5 flex-1">
                  <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Incluye</h3>
                    <ul class="mt-3 space-y-2 text-sm text-text-secondary">
                      @for (feature of plan.includes; track feature) {
                        <li class="flex gap-2">
                          <span class="text-primary font-bold">✓</span>
                          <span>{{ feature }}</span>
                        </li>
                      }
                    </ul>
                  </div>

                  <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Ideal para</h3>
                    <p class="text-sm text-text-secondary mt-2">{{ plan.idealFor }}</p>
                  </div>
                </div>

                <a
                  routerLink="/registro"
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

        <section class="max-w-6xl mx-auto px-5 pb-16">
          <div class="bg-white border border-border rounded-lg shadow-card overflow-hidden">
            <div class="p-5 border-b border-border">
              <h2 class="text-2xl font-bold text-slate-900">Comparacion rapida</h2>
              <p class="text-text-secondary text-sm mt-1">Una vista simple para elegir sin perderte en detalles.</p>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left min-w-[760px]">
                <thead class="bg-slate-50 border-b border-border text-text-secondary">
                  <tr>
                    <th class="px-5 py-3 font-semibold">Caracteristica</th>
                    @for (plan of plans; track plan.name) {
                      <th class="px-5 py-3 font-semibold">{{ plan.name }}</th>
                    }
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  @for (row of comparison; track row.label) {
                    <tr>
                      <td class="px-5 py-3 font-medium text-slate-900">{{ row.label }}</td>
                      @for (value of row.values; track $index) {
                        <td class="px-5 py-3 text-text-secondary">{{ value }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer class="bg-white border-t border-border">
        <div class="max-w-6xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-start justify-between gap-3 text-sm text-text-secondary">
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
            <a routerLink="/" class="hover:text-primary">Inicio</a>
            <a routerLink="/login" class="hover:text-primary">Ingresar</a>
            <a routerLink="/registro" class="hover:text-primary">Crear cuenta</a>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class PlansComponent {
  plans = [
    {
      name: '14 dias gratis',
      description: 'Prueba las funciones principales antes de elegir un plan mensual.',
      price: '$0',
      period: 'por 14 dias',
      badge: 'Prueba',
      cta: 'Comenzar prueba',
      featured: false,
      idealFor: 'Negocios que quieren validar Skedia sin compromiso.',
      includes: [
        'Agenda online',
        'Pagina publica de reservas',
        'Servicios y clientes',
        'Dashboard inicial',
        'Sin permanencia',
      ],
    },
    {
      name: 'Basico',
      description: 'Ordena reservas, servicios y clientes en una sola plataforma.',
      price: '$9.990',
      period: 'CLP / mes',
      badge: '',
      cta: 'Elegir Basico',
      featured: false,
      idealFor: 'Profesionales independientes o negocios pequenos.',
      includes: [
        '1 negocio',
        'Agenda mensual, semanal y anual',
        'Pagina publica de reservas',
        'Gestion de clientes',
        'Gestion de servicios',
      ],
    },
    {
      name: 'Medio',
      description: 'Suma control financiero e insumos para entender mejor tu operacion.',
      price: '$19.990',
      period: 'CLP / mes',
      badge: 'Recomendado',
      cta: 'Elegir Medio',
      featured: true,
      idealFor: 'Negocios con flujo constante de citas y compras.',
      includes: [
        'Todo Basico',
        'Finanzas: ingresos y egresos',
        'Gestion de insumos',
        'Ingresos automaticos por citas completadas',
        'Reportes de rendimiento',
      ],
    },
    {
      name: 'Premium',
      description: 'Automatizacion y soporte para equipos que necesitan mas capacidad.',
      price: '$34.990',
      period: 'CLP / mes',
      badge: 'Completo',
      cta: 'Elegir Premium',
      featured: false,
      idealFor: 'Equipos y negocios que quieren automatizar agenda y seguimiento.',
      includes: [
        'Todo Medio',
        'Google Calendar',
        'Eventos externos en agenda',
        'Invitaciones al cliente',
        'Soporte prioritario',
      ],
    },
  ];

  comparison = [
    { label: 'Prueba gratis', values: ['14 dias', 'No', 'No', 'No'] },
    { label: 'Agenda y citas', values: ['Incluido', 'Incluido', 'Incluido', 'Incluido'] },
    { label: 'Pagina publica', values: ['Incluido', 'Incluido', 'Incluido', 'Incluido'] },
    { label: 'Clientes y servicios', values: ['Incluido', 'Incluido', 'Incluido', 'Incluido'] },
    { label: 'Finanzas', values: ['Basico', 'No', 'Incluido', 'Incluido'] },
    { label: 'Insumos', values: ['No', 'No', 'Incluido', 'Incluido'] },
    { label: 'Google Calendar', values: ['No', 'No', 'No', 'Incluido'] },
    { label: 'Soporte', values: ['Comunidad', 'Estandar', 'Estandar', 'Prioritario'] },
  ];
}
