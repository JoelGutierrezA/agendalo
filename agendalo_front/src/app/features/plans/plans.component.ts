import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicFooterComponent],
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
            <h1 class="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight">
              Un plan para cada etapa de tu negocio.
            </h1>
            <p class="text-text-secondary text-lg mt-4">
              Empieza gratis por 14 dias y sube de plan cuando necesites mas capacidad, control financiero o automatizacion.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-10">
            @for (plan of plans; track plan.name) {
              <article
                class="relative overflow-hidden border rounded-lg p-5 flex flex-col transition-all duration-200 hover:-translate-y-1"
                [ngClass]="{
                  'bg-white border-border shadow-card hover:shadow-card-hover': plan.tone === 'basic',
                  'bg-gradient-to-br from-white via-primary-light to-sky-50 border-sky-200 shadow-xl shadow-sky-100/70': plan.tone === 'accent',
                  'bg-gradient-to-br from-[#071c3f] via-[#082752] to-[#0b3268] border-[#17447f] text-white shadow-2xl shadow-blue-950/25': plan.tone === 'premium'
                }"
              >
                @if (plan.tone === 'accent') {
                  <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-sky-400 to-cyan-300"></div>
                }
                @if (plan.tone === 'premium') {
                  <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500"></div>
                  <div class="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-300/15 blur-2xl"></div>
                }
                <h2 class="relative text-xl font-bold" [ngClass]="plan.tone === 'premium' ? 'text-white' : 'text-slate-900'">{{ plan.name }}</h2>
                <p class="relative text-sm mt-2 min-h-12" [ngClass]="plan.tone === 'premium' ? 'text-slate-300' : 'text-text-secondary'">{{ plan.description }}</p>
                <div class="mt-5">
                  <p class="relative text-3xl font-extrabold" [ngClass]="plan.tone === 'premium' ? 'text-white' : 'text-slate-900'">{{ plan.price }}</p>
                  <p class="relative text-xs mt-1" [ngClass]="plan.tone === 'premium' ? 'text-amber-200' : 'text-text-secondary'">{{ plan.period }}</p>
                </div>

                <div class="relative mt-6 space-y-5 flex-1">
                  <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider" [ngClass]="plan.tone === 'premium' ? 'text-amber-200' : 'text-slate-500'">Incluye</h3>
                    <ul class="mt-3 space-y-2 text-sm" [ngClass]="plan.tone === 'premium' ? 'text-slate-300' : 'text-text-secondary'">
                      @for (feature of plan.includes; track feature) {
                        <li class="flex gap-2">
                          <span class="font-bold" [ngClass]="plan.tone === 'premium' ? 'text-amber-300' : 'text-primary'">✓</span>
                          <span>{{ feature }}</span>
                        </li>
                      }
                    </ul>
                  </div>

                  <div>
                    <h3 class="text-xs font-bold uppercase tracking-wider" [ngClass]="plan.tone === 'premium' ? 'text-amber-200' : 'text-slate-500'">Ideal para</h3>
                    <p class="text-sm mt-2" [ngClass]="plan.tone === 'premium' ? 'text-slate-300' : 'text-text-secondary'">{{ plan.idealFor }}</p>
                  </div>
                </div>

                <a
                  routerLink="/registro"
                  class="relative mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                  [ngClass]="{
                    'bg-surface text-text-primary border border-border hover:bg-gray-50 focus:ring-primary': plan.tone === 'basic',
                    'bg-primary text-white hover:bg-primary-dark focus:ring-primary shadow-lg shadow-primary/20': plan.tone === 'accent',
                    'bg-amber-400 text-[#071c3f] hover:bg-amber-300 focus:ring-amber-400 focus:ring-offset-[#071c3f] shadow-lg shadow-amber-500/20': plan.tone === 'premium'
                  }"
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

      <app-public-footer />
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
      cta: 'Comenzar prueba',
      tone: 'accent',
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
      cta: 'Elegir Basico',
      tone: 'basic',
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
      cta: 'Elegir Medio',
      tone: 'accent',
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
      cta: 'Elegir Premium',
      tone: 'premium',
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
