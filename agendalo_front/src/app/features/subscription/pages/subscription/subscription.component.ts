import { CommonModule } from '@angular/common';
import { Component, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BusinessService } from '../../../settings/services/business.service';

interface SubscriptionPlan {
  name: string;
  price: string;
  description: string;
  highlight?: boolean;
  features: string[];
}

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6 fade-in">
      <div class="page-header">
        <div class="flex items-center gap-3">
          <img src="assets/Interfaz/Finanzas.png" alt="" class="w-8 h-8 rounded-lg object-cover flex-shrink-0" aria-hidden="true">
          <h1 class="page-title">Suscripcion</h1>
        </div>
        <a [href]="renewalMailto()" class="btn-primary">
          Renovar ahora
        </a>
      </div>

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article class="card xl:col-span-2 p-6 overflow-hidden relative">
          <div class="absolute inset-x-0 top-0 h-1 bg-primary"></div>

          <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Estado de suscripcion</p>
              <div class="flex flex-wrap items-center gap-3">
                <h2 class="text-2xl font-bold text-text-primary">{{ businessName() }}</h2>
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                  [ngClass]="businessActive() ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                >
                  {{ businessActive() ? 'Activa' : 'Pausada' }}
                </span>
              </div>
              <p class="text-text-secondary mt-3 max-w-2xl">
                Gestiona la renovacion de tu cuenta y solicita un cambio de plan para mantener tu agenda, clientes y reservas funcionando.
              </p>
            </div>

            <div class="rounded-lg border border-border bg-background p-4 min-w-[220px]">
              <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Plan actual</p>
              <p class="text-xl font-bold text-text-primary mt-1">Gestion manual</p>
              <p class="text-sm text-text-secondary mt-2">La renovacion se confirma con el equipo de Skedia.</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            @for (metric of summary; track metric.label) {
              <div class="rounded-lg border border-border bg-white p-4">
                <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ metric.label }}</p>
                <p class="text-lg font-bold text-text-primary mt-1">{{ metric.value }}</p>
                <p class="text-xs text-text-secondary mt-1">{{ metric.help }}</p>
              </div>
            }
          </div>
        </article>

        <aside class="card p-6">
          <h3 class="text-lg font-bold text-text-primary">Renovacion rapida</h3>
          <p class="text-sm text-text-secondary mt-2">
            Envia la solicitud con los datos de tu negocio para que el pago quede asociado correctamente.
          </p>

          <div class="mt-5 space-y-3">
            <a [href]="renewalMailto()" class="btn-primary w-full justify-center">
              Solicitar renovacion
            </a>
            <a routerLink="/planes" class="btn-secondary w-full justify-center">
              Ver planes publicos
            </a>
          </div>

          <div class="mt-6 pt-5 border-t border-border">
            <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Correo de cuenta</p>
            <p class="text-sm font-semibold text-text-primary mt-1 break-all">{{ businessEmail() }}</p>
          </div>
        </aside>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        @for (plan of plans; track plan.name) {
          <article
            class="card p-5 border transition-all duration-200 hover:shadow-card-hover"
            [ngClass]="plan.highlight ? 'border-primary bg-primary-light/40' : 'border-border bg-white'"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-text-primary">{{ plan.name }}</h3>
                <p class="text-sm text-text-secondary mt-1">{{ plan.description }}</p>
              </div>
              @if (plan.highlight) {
                <span class="px-2.5 py-1 rounded-full bg-primary text-white text-[11px] font-bold uppercase tracking-wider">
                  Recomendado
                </span>
              }
            </div>

            <p class="text-3xl font-extrabold text-text-primary mt-5">{{ plan.price }}</p>
            <p class="text-xs text-text-secondary mt-1">CLP / mes</p>

            <ul class="mt-5 space-y-2 text-sm text-text-secondary">
              @for (feature of plan.features; track feature) {
                <li class="flex gap-2">
                  <span class="text-primary font-bold">+</span>
                  <span>{{ feature }}</span>
                </li>
              }
            </ul>

            <a [href]="planMailto(plan.name)" class="btn-secondary w-full justify-center mt-6">
              Renovar con {{ plan.name }}
            </a>
          </article>
        }
      </section>
    </div>
  `,
})
export class SubscriptionComponent {
  businessName = computed(() => this.businessService.currentBusiness()?.name ?? 'Mi negocio');
  businessEmail = computed(() => this.businessService.currentBusiness()?.email ?? 'contacto@skedia.cl');
  businessActive = computed(() => this.businessService.currentBusiness()?.is_active ?? false);

  summary = [
    { label: 'Renovacion', value: 'Mensual', help: 'Disponible para todos los planes' },
    { label: 'Soporte', value: 'Skedia', help: 'Confirmacion manual del pago' },
    { label: 'Acceso', value: 'Panel completo', help: 'Agenda, clientes y reservas' },
  ];

  plans: SubscriptionPlan[] = [
    {
      name: 'Basico',
      price: '$9.990',
      description: 'Para ordenar reservas, servicios y clientes.',
      features: ['Agenda online', 'Pagina publica', 'Clientes y servicios'],
    },
    {
      name: 'Medio',
      price: '$19.990',
      description: 'Para negocios con control financiero e insumos.',
      highlight: true,
      features: ['Todo Basico', 'Finanzas', 'Gestion de insumos'],
    },
    {
      name: 'Premium',
      price: '$34.990',
      description: 'Para automatizar agenda y seguimiento.',
      features: ['Todo Medio', 'Google Calendar', 'Soporte prioritario'],
    },
  ];

  constructor(private businessService: BusinessService) {}

  renewalMailto(): string {
    return this.planMailto('Renovacion');
  }

  planMailto(planName: string): string {
    const subject = encodeURIComponent(`Renovar suscripcion ${planName} - ${this.businessName()}`);
    const body = encodeURIComponent(
      `Hola, quiero renovar mi suscripcion de Skedia.\n\nNegocio: ${this.businessName()}\nPlan solicitado: ${planName}\nCorreo del negocio: ${this.businessEmail()}\n`
    );

    return `mailto:contacto@skedia.cl?subject=${subject}&body=${body}`;
  }
}
