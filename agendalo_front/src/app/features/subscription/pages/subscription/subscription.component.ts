import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { ToastService } from '../../../../core/services/toast.service';
import { BusinessService } from '../../../settings/services/business.service';
import { Plan, SubscriptionService } from '../../services/subscription.service';

interface SubscriptionPlan {
  code: 'agenda' | 'premium';
  name: string;
  price: string;
  billingPeriodDays?: number;
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
        <a href="#planes" class="btn-primary">
          Ver planes
        </a>
      </div>

      @if (accessNotice() === 'expired') {
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Tu suscripcion no esta activa. Renueva tu plan para recuperar el acceso a tu agenda, clientes, servicios y reservas publicas.
        </div>
      } @else if (accessNotice() === 'feature') {
        <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Esta funcionalidad esta disponible en Premium. Puedes revisar tu plan actual y solicitar el cambio desde aqui.
        </div>
      }

      @if (openSubscriptionRequest()) {
        <div class="rounded-lg border border-primary/20 bg-primary-light/40 px-4 py-3 text-sm text-text-primary">
          <p class="font-bold">Ya tienes una solicitud en proceso.</p>
          <p class="mt-1 text-text-secondary">Espera a que sea revisada antes de crear una nueva.</p>
        </div>
      }

      <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <article class="card xl:col-span-2 p-6 overflow-hidden relative">
          <div class="absolute inset-x-0 top-0 h-1" [ngClass]="statusAccentClass()"></div>

          <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div class="max-w-2xl">
              <p class="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Estado de suscripcion</p>
              <div class="flex flex-wrap items-center gap-3">
                <h2 class="text-2xl font-bold text-text-primary">{{ statusTitle() }}</h2>
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                  [ngClass]="subscriptionStatusClass()"
                >
                  {{ subscriptionStatusLabel() }}
                </span>
              </div>
              <p class="text-text-secondary mt-3">{{ statusMessage() }}</p>
            </div>

            <div class="rounded-lg border border-border bg-background p-4 min-w-[220px]">
              <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Precio actual</p>
              <p class="text-xl font-bold text-text-primary mt-1">{{ currentPrice() }}</p>
              <p class="text-sm text-text-secondary mt-2">{{ priceHelp() }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
            @for (metric of summary(); track metric.label) {
              <div class="rounded-lg border border-border bg-white p-4">
                <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">{{ metric.label }}</p>
                <p class="text-lg font-bold text-text-primary mt-1">{{ metric.value }}</p>
                <p class="text-xs text-text-secondary mt-1">{{ metric.help }}</p>
              </div>
            }
          </div>
        </article>

        <aside class="card p-6">
          <h3 class="text-lg font-bold text-text-primary">Incluye ahora</h3>
          <p class="text-sm text-text-secondary mt-2">{{ currentBenefitsIntro() }}</p>

          <ul class="mt-5 space-y-2 text-sm text-text-secondary">
            @for (feature of currentBenefits(); track feature) {
              <li class="flex gap-2">
                <span class="text-primary font-bold">+</span>
                <span>{{ feature }}</span>
              </li>
            }
          </ul>

          <div class="mt-6 pt-5 border-t border-border">
            <p class="text-xs font-bold uppercase tracking-wider text-text-secondary">Correo de cuenta</p>
            <p class="text-sm font-semibold text-text-primary mt-1 break-all">{{ businessEmail() }}</p>
          </div>
        </aside>
      </section>

      <section id="planes" class="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-mt-6">
        @for (plan of plans(); track plan.code) {
          <article
            class="card p-5 border transition-all duration-200 hover:shadow-card-hover flex min-h-full flex-col"
            [ngClass]="planCardClass(plan)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="text-lg font-bold text-text-primary">{{ plan.name }}</h3>
                <p class="text-sm text-text-secondary mt-1">{{ plan.description }}</p>
              </div>
              @if (planBadge(plan); as badge) {
                <span
                  class="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                  [ngClass]="planBadgeClass(plan)"
                >
                  {{ badge }}
                </span>
              }
            </div>

            <p class="text-3xl font-extrabold text-text-primary mt-5">{{ plan.price }}</p>
            <p class="text-xs text-text-secondary mt-1">{{ planPeriodLabel(plan) }}</p>

            <ul class="mt-5 mb-6 space-y-2 text-sm text-text-secondary">
              @for (feature of plan.features; track feature) {
                <li class="flex gap-2">
                  <span class="text-primary font-bold">+</span>
                  <span>{{ feature }}</span>
                </li>
              }
            </ul>

            <button
              type="button"
              class="btn-secondary w-full justify-center mt-auto disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="isPlanRequestDisabled()"
              (click)="requestPlan(plan)"
            >
              @if (submittingPlanCode() === plan.code) {
                Enviando...
              } @else {
                {{ planCtaLabel(plan) }}
              }
            </button>
          </article>
        }
      </section>
    </div>
  `,
})
export class SubscriptionComponent implements OnInit {
  accessNotice = signal<'feature' | 'expired' | null>(null);
  businessName = computed(() => this.businessService.currentBusiness()?.name ?? 'Mi negocio');
  businessEmail = computed(() => this.businessService.currentBusiness()?.email ?? 'contacto@skedia.cl');
  currentSubscription = computed(() => this.subscriptionService.currentSubscription());
  openSubscriptionRequest = computed(() => this.subscriptionService.openSubscriptionRequest());
  subscriptionStatusLabel = computed(() => this.subscriptionService.statusLabel());
  currentPlanCode = computed(() => this.currentSubscription()?.plan?.code ?? '');
  isTrial = computed(() => this.currentSubscription()?.status === 'trialing');
  isActive = computed(() => this.currentSubscription()?.status === 'active');
  submittingPlanCode = signal<string | null>(null);

  statusTitle = computed(() => {
    const subscription = this.currentSubscription();
    if (!subscription) return 'Sin suscripcion';
    if (this.subscriptionService.effectiveState(subscription) === 'grace') return 'Periodo de gracia';
    if (this.subscriptionService.isExpiredEffective(subscription)) return 'Suscripcion vencida';
    if (this.isTrial()) return 'Prueba gratuita';

    const planName = subscription.plan?.name ?? 'Plan';
    return this.isActive() ? `Plan actual: ${planName}` : this.subscriptionService.planLabel(subscription);
  });

  statusMessage = computed(() => {
    const subscription = this.currentSubscription();
    if (!subscription) return 'No hay una suscripcion asociada a este negocio.';
    if (this.subscriptionService.effectiveState(subscription) === 'grace') {
      const days = this.subscriptionService.gracePeriodDaysRemaining(subscription);
      return days === 1
        ? 'Tu suscripcion vencio. Te queda 1 dia para renovarla antes del bloqueo operativo.'
        : `Tu suscripcion vencio. Te quedan ${days} dias para renovarla antes del bloqueo operativo.`;
    }
    if (this.subscriptionService.isExpiredEffective(subscription)) {
      return 'La suscripcion esta vencida. Renueva tu plan para recuperar el acceso operativo.';
    }
    if (this.isTrial()) return 'Tienes acceso a todas las funciones de Skedia durante tu prueba gratuita.';
    if (this.isActive() && this.currentPlanCode() === 'agenda') {
      return 'Agenda esta activo para gestionar citas, clientes, servicios, reservas online e ingresos por servicios.';
    }
    if (this.isActive() && this.currentPlanCode() === 'premium') {
      return 'Premium esta activo con agenda, reservas, finanzas completas e insumos.';
    }
    return 'Gestiona la renovacion de tu cuenta y solicita un cambio de plan para mantener tu negocio funcionando.';
  });

  summary = computed(() => {
    const subscription = this.currentSubscription();
    const plan = subscription?.plan ?? null;

    return [
      { label: 'Plan', value: this.isTrial() ? 'Prueba gratuita' : plan?.name ?? 'Sin plan', help: this.isTrial() ? 'Acceso completo temporal' : 'Plan mensual' },
      { label: 'Estado', value: this.subscriptionService.statusLabel(subscription), help: this.statusHelp() },
      {
        label: this.subscriptionService.effectiveState(subscription) === 'grace' ? 'Dias de gracia' : 'Dias restantes',
        value: this.subscriptionService.effectiveState(subscription) === 'grace'
          ? `${this.subscriptionService.gracePeriodDaysRemaining(subscription)} dias`
          : this.subscriptionService.daysRemainingLabel(subscription),
        help: this.subscriptionService.effectiveState(subscription) === 'grace' ? 'Para renovar' : 'Hasta el vencimiento',
      },
      { label: 'Vencimiento', value: this.formatDate(subscription?.ends_at), help: this.isTrial() ? 'Termino de prueba' : 'Renovacion mensual' },
    ];
  });

  currentPrice = computed(() => {
    const subscription = this.currentSubscription();
    if (this.isTrial()) return '$0';
    if (!subscription?.plan) return '-';

    return this.subscriptionService.formatPrice(subscription.plan);
  });

  priceHelp = computed(() => this.isTrial() ? 'Prueba gratuita de 14 dias.' : 'Precio mensual del plan actual.');

  currentBenefitsIntro = computed(() => {
    if (this.isTrial()) return 'Durante la prueba gratuita tienes acceso completo equivalente a Premium.';
    if (this.currentPlanCode() === 'premium') return 'Tu plan Premium mantiene agenda, finanzas e insumos activos.';
    if (this.currentPlanCode() === 'agenda') return 'Tu plan Agenda se enfoca en citas, clientes, servicios y reservas.';

    return 'Revisa las alternativas disponibles para tu negocio.';
  });

  currentBenefits = computed(() => {
    if (this.subscriptionService.hasPremiumExperience(this.currentSubscription())) {
      return ['Agenda y citas', 'Reservas online', 'Clientes y servicios', 'Ingresos manuales', 'Egresos y balance', 'Insumos y stock'];
    }

    if (this.currentPlanCode() === 'agenda') {
      return ['Agenda y citas', 'Reservas online', 'Clientes y servicios', 'Horarios', 'Google Calendar', 'Ingresos por servicios'];
    }

    return ['Agenda y citas', 'Reservas online', 'Clientes y servicios'];
  });

  private readonly planContent: SubscriptionPlan[] = [
    {
      code: 'agenda',
      name: 'Agenda',
      price: '$9.990',
      description: 'Para profesionales que necesitan gestionar sus citas, clientes y reservas.',
      features: [
        'Agenda y citas',
        'Reservas online',
        'Servicios',
        'Clientes',
        'Horarios',
        'Google Calendar',
        'Ingresos por servicios',
        'Google Meet proximamente',
      ],
    },
    {
      code: 'premium',
      name: 'Premium',
      price: '$19.990',
      description: 'Para negocios que ademas necesitan gestionar sus finanzas e insumos.',
      highlight: true,
      features: [
        'Todo lo de Agenda',
        'Ingresos manuales',
        'Egresos',
        'Balance',
        'Insumos',
        'Control de stock/movimientos',
      ],
    },
  ];

  constructor(
    private businessService: BusinessService,
    private subscriptionService: SubscriptionService,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  plans = computed<SubscriptionPlan[]>(() => {
    const dbPlans = this.subscriptionService.availablePlans();

    return this.planContent.map(plan => {
      const dbPlan = dbPlans.find(current => current.code === plan.code);

      if (!dbPlan) return plan;

      return {
        ...plan,
        name: dbPlan.name,
        price: this.subscriptionService.formatPrice(dbPlan),
        billingPeriodDays: dbPlan.billing_period_days,
        description: dbPlan.description || plan.description,
      };
    });
  });

  ngOnInit(): void {
    this.subscriptionService.loadCurrent().subscribe({ error: () => undefined });
    this.subscriptionService.loadPlans().subscribe({ error: () => undefined });
    this.subscriptionService.loadOpenSubscriptionRequest().subscribe({ error: () => undefined });
    this.route.queryParamMap.subscribe(params => {
      if (params.has('subscriptionRequired')) {
        this.accessNotice.set('expired');
        return;
      }

      this.accessNotice.set(params.has('blockedFeature') ? 'feature' : null);
    });
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'planes' && typeof document !== 'undefined') {
        setTimeout(() => document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    });
  }

  planCardClass(plan: SubscriptionPlan): string {
    if (this.isCurrentActivePlan(plan)) return 'border-primary bg-primary-light/30';
    if (plan.highlight) return 'border-primary bg-primary-light/40';

    return 'border-border bg-white';
  }

  planBadge(plan: SubscriptionPlan): string {
    if (this.isCurrentActivePlan(plan)) return 'Plan actual';
    if (this.isTrial()) return 'Disponible despues de tu prueba';
    if (plan.highlight) return 'Recomendado';

    return '';
  }

  planBadgeClass(plan: SubscriptionPlan): string {
    if (this.isCurrentActivePlan(plan)) return 'bg-primary text-white';
    if (this.isTrial()) return 'bg-slate-100 text-slate-700';
    if (plan.highlight) return 'bg-primary text-white';

    return 'bg-slate-100 text-slate-700';
  }

  isCurrentActivePlan(plan: SubscriptionPlan): boolean {
    return this.isActive() && this.currentPlanCode() === plan.code;
  }

  planCtaLabel(plan: SubscriptionPlan): string {
    const subscription = this.currentSubscription();
    const effectiveState = this.subscriptionService.effectiveState(subscription);

    if (!subscription || effectiveState === 'grace' || effectiveState === 'expired' || this.isTrial()) {
      return `Solicitar ${plan.name}`;
    }

    if (effectiveState === 'active' && this.currentPlanCode() === plan.code) return `Renovar ${plan.name}`;
    if (effectiveState === 'active' && this.currentPlanCode() && this.currentPlanCode() !== plan.code) return `Cambiar a ${plan.name}`;

    return `Solicitar ${plan.name}`;
  }

  planPeriodLabel(plan: SubscriptionPlan): string {
    if (!plan.billingPeriodDays) return 'CLP / periodo del plan';

    return plan.billingPeriodDays === 1
      ? 'CLP / 1 dia'
      : `CLP / ${plan.billingPeriodDays} dias`;
  }

  isPlanRequestDisabled(): boolean {
    return !!this.openSubscriptionRequest() || this.submittingPlanCode() !== null;
  }

  async requestPlan(plan: SubscriptionPlan): Promise<void> {
    if (this.openSubscriptionRequest()) {
      this.showOpenRequestMessage();
      return;
    }

    const result = await Swal.fire({
      title: this.confirmationTitle(plan),
      html: this.confirmationHtml(plan),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.confirmationButtonText(plan),
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    this.submittingPlanCode.set(plan.code);
    this.subscriptionService.createSubscriptionRequest(plan.code).subscribe({
      next: () => {
        void Swal.fire({
          title: 'Solicitud enviada',
          text: 'Recibimos tu solicitud. Te enviaremos por correo las instrucciones para continuar. Tu suscripcion actual no cambiara hasta que el proceso sea confirmado.',
          icon: 'success',
          confirmButtonText: 'Entendido',
        });
        this.subscriptionService.loadOpenSubscriptionRequest().subscribe({ error: () => undefined });
        this.submittingPlanCode.set(null);
      },
      error: (err) => {
        this.submittingPlanCode.set(null);
        const message = this.requestErrorMessage(err?.message);
        this.toastService.error(message);
        void Swal.fire({
          title: 'No se pudo enviar la solicitud',
          text: message,
          icon: 'error',
          confirmButtonText: 'Entendido',
        });
      },
    });
  }

  subscriptionStatusClass(): string {
    const subscription = this.currentSubscription();

    if (!subscription) return 'bg-slate-100 text-slate-700';
    if (this.subscriptionService.daysRemaining(subscription) === 0) return 'bg-red-50 text-red-700';
    if (this.expiryTone() === 'urgent') return 'bg-red-50 text-red-700';
    if (this.expiryTone() === 'warning') return 'bg-amber-50 text-amber-700';
    if (subscription.status === 'trialing') return 'bg-cyan-50 text-cyan-700';
    if (subscription.status === 'past_due') return 'bg-amber-50 text-amber-700';
    if (subscription.status === 'cancelled') return 'bg-red-50 text-red-700';

    return 'bg-emerald-50 text-emerald-700';
  }

  statusAccentClass(): string {
    if (this.expiryTone() === 'urgent') return 'bg-red-500';
    if (this.expiryTone() === 'warning') return 'bg-amber-500';

    return 'bg-primary';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
    }).format(date);
  }

  private statusHelp(): string {
    const subscription = this.currentSubscription();
    if (!subscription) return 'Pendiente de asignacion';
    if (this.isTrial()) return 'Premium temporal';
    if (this.isActive()) return 'Activo';

    return this.subscriptionService.planLabel(subscription);
  }

  private expiryTone(): 'normal' | 'warning' | 'urgent' {
    const subscription = this.currentSubscription();
    if (!subscription || !['trialing', 'active'].includes(subscription.status)) return 'normal';

    const days = this.subscriptionService.daysRemaining(subscription);
    if (days === 1) return 'urgent';
    if (days >= 2 && days <= 5) return 'warning';

    return 'normal';
  }

  private confirmationTitle(plan: SubscriptionPlan): string {
    const label = this.planCtaLabel(plan);

    if (label.startsWith('Renovar')) return `¿${label}?`;
    if (label.startsWith('Cambiar')) return `¿${label}?`;

    return `¿Solicitar plan ${plan.name}?`;
  }

  private confirmationButtonText(plan: SubscriptionPlan): string {
    const label = this.planCtaLabel(plan).toLowerCase();
    return `Si, ${label}`;
  }

  private confirmationHtml(plan: SubscriptionPlan): string {
    const currentSituation = this.currentSituationText();
    const days = this.subscriptionService.daysRemaining(this.currentSubscription());
    const daysText = days === 1 ? '1 dia' : `${days} dias`;
    const preservation = this.preservationText(plan, daysText);
    const period = plan.billingPeriodDays
      ? plan.billingPeriodDays === 1 ? '1 dia' : `${plan.billingPeriodDays} dias`
      : 'periodo definido para el plan';

    return `
      <div class="text-left space-y-3">
        <p>${currentSituation} y te quedan <strong>${daysText}</strong>.</p>
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p><strong>Plan solicitado:</strong> ${plan.name}</p>
          <p><strong>Precio:</strong> ${plan.price}</p>
          <p><strong>Periodo:</strong> ${period}</p>
        </div>
        <p>${preservation}</p>
      </div>
    `;
  }

  private currentSituationText(): string {
    const subscription = this.currentSubscription();
    const effectiveState = this.subscriptionService.effectiveState(subscription);

    if (!subscription) return 'Actualmente no tienes una suscripcion activa';
    if (subscription.status === 'trialing' && effectiveState === 'active') return 'Actualmente estas en tu prueba gratuita';
    if (effectiveState === 'grace' || effectiveState === 'expired') return `Actualmente tu ${this.subscriptionService.planLabel(subscription)} no esta activa`;

    return `Actualmente tienes ${subscription.plan?.name ?? 'tu plan'}`;
  }

  private preservationText(plan: SubscriptionPlan, daysText: string): string {
    const label = this.planCtaLabel(plan);

    if (label.startsWith('Cambiar')) {
      return `Al completar el cambio, pasaras a ${plan.name} y conservaras todos tus dias restantes.`;
    }

    if (label.startsWith('Renovar')) {
      return `Al renovar, esos ${daysText} se conservaran y se sumaran al nuevo periodo.`;
    }

    return `Si continuas con ${plan.name}, esos ${daysText} se conservaran y se sumaran al nuevo periodo del plan.`;
  }

  private showOpenRequestMessage(): void {
    void Swal.fire({
      title: 'Ya tienes una solicitud en proceso',
      text: 'Espera a que sea revisada antes de crear una nueva.',
      icon: 'info',
      confirmButtonText: 'Entendido',
    });
  }

  private requestErrorMessage(message: string | undefined): string {
    const normalized = (message ?? '').toLowerCase();

    if (normalized.includes('ya existe una solicitud')) {
      return 'Ya tienes una solicitud en proceso. Espera a que sea revisada antes de crear una nueva.';
    }

    return message || 'No se pudo enviar la solicitud. Intenta nuevamente.';
  }
}
