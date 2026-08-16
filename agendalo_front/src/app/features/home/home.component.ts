import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LandingCapabilitiesComponent } from './landing-capabilities.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LandingCapabilitiesComponent, PublicFooterComponent],
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
          class="home-hero relative min-h-[360px] sm:min-h-[500px] lg:min-h-[560px] flex items-center bg-slate-50 bg-no-repeat overflow-hidden"
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

        <app-landing-capabilities />

        <section class="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 pt-14 sm:pt-16 pb-16 sm:pb-24">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h2 class="text-3xl font-extrabold text-slate-900">Elige cómo quieres empezar</h2>
              <p class="text-text-secondary mt-2 max-w-2xl">
                Planes pensados para distintas etapas de tu negocio.
              </p>
            </div>
            <a routerLink="/planes" class="btn-secondary justify-center">Ver detalle completo</a>
          </div>

          <div class="bg-primary-light border border-sky-200 rounded-lg shadow-card p-5 sm:p-6 mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div class="flex items-start gap-4">
              <img src="assets/Iconos/Organiza.png" alt="" class="w-14 h-14 rounded-lg object-contain flex-shrink-0 shadow-card" aria-hidden="true">
              <div>
                <h3 class="text-xl font-bold text-slate-900">Prueba Skedia gratis durante 14 días</h3>
                <p class="mt-1 text-sm sm:text-base text-text-secondary">
                  Configura tu negocio, organiza tus primeras reservas y descubre cómo Skedia puede ayudarte en tu día a día.
                </p>
                <div class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-text-secondary">
                  <span class="inline-flex items-center gap-1"><span class="text-primary font-bold">✓</span>14 días para probarlo</span>
                  <span class="inline-flex items-center gap-1"><span class="text-primary font-bold">✓</span>Sin compromiso</span>
                  <span class="inline-flex items-center gap-1"><span class="text-primary font-bold">✓</span>Elige tu plan después</span>
                </div>
              </div>
            </div>
            <a routerLink="/registro" class="btn-primary justify-center px-5 py-3 lg:flex-shrink-0">
              Probar Skedia gratis
            </a>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                @if (plan.recommended) {
                  <span class="absolute right-5 top-5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-lg shadow-primary/20">
                    Más elegido
                  </span>
                }
                <h3 class="relative text-lg font-bold" [ngClass]="plan.tone === 'premium' ? 'text-white' : 'text-slate-900'">{{ plan.name }}</h3>
                <p class="relative text-sm mt-1 min-h-10" [ngClass]="plan.tone === 'premium' ? 'text-slate-300' : 'text-text-secondary'">{{ plan.description }}</p>
                <div class="mt-5">
                  <p class="relative text-3xl font-extrabold" [ngClass]="plan.tone === 'premium' ? 'text-white' : 'text-slate-900'">{{ plan.price }}</p>
                  <p class="relative text-xs mt-1" [ngClass]="plan.tone === 'premium' ? 'text-amber-200' : 'text-text-secondary'">{{ plan.period }}</p>
                </div>
                <ul class="relative mt-5 space-y-2 text-sm flex-1" [ngClass]="plan.tone === 'premium' ? 'text-slate-300' : 'text-text-secondary'">
                  @for (feature of plan.features; track feature) {
                    <li class="flex gap-2">
                      <span class="font-bold" [ngClass]="plan.tone === 'premium' ? 'text-amber-300' : 'text-primary'">✓</span>
                      <span>{{ feature }}</span>
                    </li>
                  }
                </ul>
                <a
                  [routerLink]="plan.ctaLink"
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
      </main>

      <app-public-footer />
    </div>
  `,
  styles: [`
    .home-hero {
      background-image:
        linear-gradient(90deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0.88) 32%, rgba(248, 250, 252, 0.42) 52%, rgba(248, 250, 252, 0.06) 100%),
        url('/assets/Hero.png'),
        radial-gradient(circle at 78% 42%, rgba(221, 232, 255, 0.9) 0%, rgba(237, 244, 255, 0.72) 34%, rgba(248, 250, 252, 0) 72%),
        linear-gradient(180deg, #f8fafc 0%, #eef5ff 52%, #f8fafc 100%);
      background-size: 100% 100%, auto 116%, 84% 100%, 100% 100%;
      background-position: center, 79% center, right center, center;
      background-repeat: no-repeat;
    }

    @media (max-width: 639px) {
      .home-hero {
        background-image: linear-gradient(180deg, #f8fafc 0%, #eef5ff 100%);
        background-size: 100% 100%;
        background-position: center;
      }
    }
  `],
})
export class HomeComponent {
  plans = [
    {
      name: 'Básico',
      description: 'Para negocios pequeños que necesitan ordenar reservas y clientes.',
      price: '$9.990',
      period: 'CLP / mes',
      cta: 'Elegir Básico',
      ctaLink: '/registro',
      tone: 'basic',
      recommended: false,
      features: ['1 negocio', 'Agenda y reservas', 'Clientes y servicios', 'Página pública de reservas'],
    },
    {
      name: 'Medio',
      description: 'Para negocios con más movimiento que necesitan mayor control de su operación.',
      price: '$19.990',
      period: 'CLP / mes',
      cta: 'Elegir Medio',
      ctaLink: '/registro',
      tone: 'accent',
      recommended: true,
      features: ['Todo lo del plan Básico', 'Ingresos y egresos', 'Balance del negocio', 'Indicadores y seguimiento'],
    },
    {
      name: 'Premium',
      description: 'Para negocios que necesitan mayor integración y control.',
      price: '$34.990',
      period: 'CLP / mes',
      cta: 'Elegir Premium',
      ctaLink: '/registro',
      tone: 'premium',
      recommended: false,
      features: ['Todo lo del plan Medio', 'Sincronización con Google Calendar', 'Soporte prioritario'],
    },
  ];
}
