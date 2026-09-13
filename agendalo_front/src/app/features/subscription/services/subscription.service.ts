import { Injectable, signal } from '@angular/core';
import { defer, finalize, Observable, of, tap } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { BusinessService } from '../../settings/services/business.service';

export type FeatureKey =
  | 'agenda'
  | 'public_booking'
  | 'clients'
  | 'services'
  | 'google_calendar'
  | 'income_summary'
  | 'manual_income'
  | 'expenses'
  | 'balance'
  | 'supplies'
  | 'inventory';

export interface Plan {
  id?: number;
  code: 'agenda' | 'premium' | string;
  name: string;
  description?: string | null;
  price_clp: number;
  billing_period_days?: number;
  features: Partial<Record<FeatureKey, boolean>>;
}

export interface BusinessSubscription {
  status: 'trialing' | 'active' | 'past_due' | 'expired' | 'cancelled' | string;
  starts_at: string;
  ends_at: string;
  trial_ends_at: string | null;
  cancelled_at?: string | null;
  plan: Plan | null;
}

export interface SubscriptionRequest {
  id: number;
  business_id: number;
  profile_id: string;
  request_type: 'subscription_activation' | 'subscription_renewal' | 'subscription_change' | string;
  status: 'pending' | 'instructions_sent' | 'completed' | 'cancelled' | string;
  remaining_days_snapshot: number;
  requested_period_days: number;
  created_at: string;
}

export type TrialTone = 'normal' | 'warning' | 'urgent';
export type EffectiveSubscriptionState = 'active' | 'grace' | 'expired' | 'none';

export interface TrialPresentation {
  title: string;
  message: string;
  daysText: string;
  compactDaysText: string;
  daysRemaining: number;
  endsAt: string;
  tone: TrialTone;
}

export interface ExpiryWarningPresentation {
  title: string;
  message: string;
  impact: string;
  cta: string;
  daysRemaining: number;
  tone: Extract<TrialTone, 'warning' | 'urgent'>;
}

export interface GracePeriodPresentation {
  title: string;
  message: string;
  cta: string;
  daysRemaining: number;
}

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  currentSubscription = signal<BusinessSubscription | null>(null);
  availablePlans = signal<Plan[]>([]);
  openSubscriptionRequest = signal<SubscriptionRequest | null>(null);
  loading = signal(false);
  requestLoading = signal(false);
  private loadedBusinessId: number | null = null;
  private readonly gracePeriodDays = 10;

  constructor(
    private authService: AuthService,
    private businessService: BusinessService,
    private supabase: SupabaseService
  ) {}

  ensureLoaded(): Observable<BusinessSubscription | null> {
    const businessId = this.businessService.currentBusiness()?.id ?? null;

    if (!businessId || this.authService.currentUser()?.role === 'admin_platform') {
      this.currentSubscription.set(null);
      this.loadedBusinessId = businessId;
      return of(null);
    }

    if (this.loadedBusinessId === businessId) {
      return of(this.currentSubscription());
    }

    return this.loadCurrent();
  }

  loadCurrent(): Observable<BusinessSubscription | null> {
    return defer(async () => {
      const businessId = this.businessService.currentBusiness()?.id;

      if (!businessId || this.authService.currentUser()?.role === 'admin_platform') {
        return null;
      }

      this.loading.set(true);

      const { data, error } = await this.supabase.client
        .from('business_subscriptions')
        .select(`
          status,
          starts_at,
          ends_at,
          trial_ends_at,
          cancelled_at,
          plan:plans(code, name, price_clp, billing_period_days, features)
        `)
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return this.mapSubscription(data);
    }).pipe(
      tap(subscription => {
        this.currentSubscription.set(subscription);
        this.loadedBusinessId = this.businessService.currentBusiness()?.id ?? null;
      }),
      finalize(() => this.loading.set(false))
    );
  }

  loadPlans(): Observable<Plan[]> {
    return defer(async () => {
      const { data, error } = await this.supabase.client
        .from('plans')
        .select('id, code, name, description, price_clp, billing_period_days, features')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []).map(plan => this.mapPlan(plan));
    }).pipe(
      tap(plans => this.availablePlans.set(plans))
    );
  }

  loadOpenSubscriptionRequest(): Observable<SubscriptionRequest | null> {
    return defer(async () => {
      const businessId = this.businessService.currentBusiness()?.id;

      if (!businessId || this.authService.currentUser()?.role === 'admin_platform') {
        return null;
      }

      const { data, error } = await this.supabase.client
        .from('subscription_requests')
        .select('id, business_id, profile_id, request_type, status, remaining_days_snapshot, requested_period_days, created_at')
        .eq('business_id', businessId)
        .in('status', ['pending', 'instructions_sent'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as SubscriptionRequest | null;
    }).pipe(
      tap(request => this.openSubscriptionRequest.set(request))
    );
  }

  createSubscriptionRequest(planCode: string, notes?: string): Observable<SubscriptionRequest> {
    return defer(async () => {
      this.requestLoading.set(true);

      const { data, error } = await this.supabase.client.rpc('create_subscription_request', {
        target_plan_code: planCode,
        target_notes: notes ?? null,
      });

      if (error) throw new Error(error.message);
      return data as SubscriptionRequest;
    }).pipe(
      tap(request => this.openSubscriptionRequest.set(request)),
      finalize(() => this.requestLoading.set(false))
    );
  }

  hasFeature(feature: FeatureKey): boolean {
    const subscription = this.currentSubscription();
    if (!this.canViewPlanFeatures(subscription)) return false;

    return subscription?.plan?.features?.[feature] === true;
  }

  isAccessActive(subscription = this.currentSubscription()): boolean {
    return this.effectiveState(subscription) === 'active';
  }

  canOperate(subscription = this.currentSubscription()): boolean {
    return this.effectiveState(subscription) === 'active';
  }

  isReadOnlyMode(subscription = this.currentSubscription()): boolean {
    return this.effectiveState(subscription) === 'grace';
  }

  isExpiredEffective(subscription = this.currentSubscription()): boolean {
    return this.effectiveState(subscription) === 'expired';
  }

  effectiveState(subscription = this.currentSubscription()): EffectiveSubscriptionState {
    if (!subscription) return 'none';
    const endsAt = this.parseDate(subscription.ends_at);
    if (!endsAt) return 'expired';

    const now = Date.now();
    if (['trialing', 'active'].includes(subscription.status) && endsAt.getTime() > now) {
      return 'active';
    }

    const graceEndsAt = this.gracePeriodEndsAt(subscription);
    if (
      ['trialing', 'active', 'past_due'].includes(subscription.status)
      && endsAt.getTime() <= now
      && graceEndsAt
      && now < graceEndsAt.getTime()
    ) {
      return 'grace';
    }

    return 'expired';
  }

  planLabel(subscription = this.currentSubscription()): string {
    if (!subscription) return 'Sin plan';

    const planName = subscription.plan?.name ?? 'Plan';
    if (subscription.status === 'cancelled') return `${planName} cancelado`;
    if (this.effectiveState(subscription) === 'expired') return `${planName} vencido`;
    if (subscription.status === 'trialing') return 'Prueba gratuita';
    if (subscription.status === 'past_due') return `${planName} pendiente`;

    return planName;
  }

  statusLabel(subscription = this.currentSubscription()): string {
    if (!subscription) return 'Sin suscripcion';
    if (subscription.status === 'cancelled') return 'Cancelada';

    const effectiveState = this.effectiveState(subscription);
    if (effectiveState === 'grace') return 'Periodo de gracia';
    if (effectiveState === 'expired') return 'Vencida';

    const labels: Record<string, string> = {
      trialing: 'Prueba activa',
      active: 'Activa',
      past_due: 'Pago pendiente',
      expired: 'Vencida',
      cancelled: 'Cancelada',
    };

    return labels[subscription.status] ?? subscription.status;
  }

  daysRemaining(subscription = this.currentSubscription()): number {
    const endsAt = subscription?.ends_at;
    if (!endsAt) return 0;

    const endTime = new Date(endsAt).getTime();
    if (Number.isNaN(endTime)) return 0;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.ceil((endTime - Date.now()) / millisecondsPerDay));
  }

  daysRemainingLabel(subscription = this.currentSubscription()): string {
    if (!subscription) return 'Sin plan';

    const days = this.daysRemaining(subscription);
    return days === 1 ? '1 dia' : `${days} dias`;
  }

  gracePeriodDaysRemaining(subscription = this.currentSubscription()): number {
    if (this.effectiveState(subscription) !== 'grace') return 0;

    const graceEndsAt = this.gracePeriodEndsAt(subscription);
    if (!graceEndsAt) return 0;

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    return Math.max(0, Math.ceil((graceEndsAt.getTime() - Date.now()) / millisecondsPerDay));
  }

  gracePeriodPresentation(subscription = this.currentSubscription()): GracePeriodPresentation | null {
    if (this.effectiveState(subscription) !== 'grace') return null;

    const days = this.gracePeriodDaysRemaining(subscription);
    return {
      title: 'Tu suscripcion vencio',
      message: days === 1
        ? 'Te queda 1 dia para renovarla antes de que tu acceso sea bloqueado.'
        : `Te quedan ${days} dias para renovarla antes de que tu acceso sea bloqueado.`,
      cta: 'Renovar suscripcion',
      daysRemaining: days,
    };
  }

  usesServiceIncomeOnly(subscription = this.currentSubscription()): boolean {
    return subscription?.status !== 'trialing' && subscription?.plan?.code === 'agenda';
  }

  incomeSummaryLabel(subscription = this.currentSubscription()): string {
    return this.usesServiceIncomeOnly(subscription) ? 'Ingresos por servicios' : 'Ingresos';
  }

  hasPremiumExperience(subscription = this.currentSubscription()): boolean {
    return subscription?.status === 'trialing' || subscription?.plan?.code === 'premium';
  }

  expiryWarningPresentation(subscription = this.currentSubscription()): ExpiryWarningPresentation | null {
    if (!subscription || this.effectiveState(subscription) !== 'active') return null;

    const days = this.daysRemaining(subscription);
    if (days < 1 || days > 5) return null;

    if (days === 1) {
      return {
        title: 'Tu suscripción vence mañana',
        message: 'Renueva tu plan para evitar que tu enlace de reservas quede deshabilitado.',
        impact: 'Cuando finalice tu suscripción, tu enlace público de reservas y código QR quedarán deshabilitados.',
        cta: 'Ver mi suscripción',
        daysRemaining: days,
        tone: 'urgent',
      };
    }

    return {
      title: 'Tu suscripción vence pronto',
      message: `Te quedan ${days} días para renovar tu plan.`,
      impact: 'Cuando finalice tu suscripción, tu enlace público de reservas y código QR quedarán deshabilitados.',
      cta: 'Ver mi suscripción',
      daysRemaining: days,
      tone: 'warning',
    };
  }

  trialPresentation(subscription = this.currentSubscription()): TrialPresentation | null {
    if (!subscription || subscription.status !== 'trialing') return null;

    const days = this.daysRemaining(subscription);
    if (days <= 0) return null;

    if (days === 1) {
      return {
        title: 'Tu prueba gratuita termina mañana',
        message: 'Elige un plan para continuar usando Skedia.',
        daysText: 'Te queda 1 día',
        compactDaysText: '1 día restante',
        daysRemaining: days,
        endsAt: subscription.ends_at,
        tone: 'urgent',
      };
    }

    if (days <= 5) {
      return {
        title: 'Tu prueba gratuita termina pronto',
        message: 'Elige un plan para seguir utilizando Skedia sin interrupciones.',
        daysText: `Te quedan ${days} días`,
        compactDaysText: `${days} días restantes`,
        daysRemaining: days,
        endsAt: subscription.ends_at,
        tone: 'warning',
      };
    }

    return {
      title: 'Prueba gratuita',
      message: 'Estás disfrutando todas las funciones de Skedia.',
      daysText: `Te quedan ${days} días`,
      compactDaysText: `${days} días restantes`,
      daysRemaining: days,
      endsAt: subscription.ends_at,
      tone: 'normal',
    };
  }

  formatPrice(plan: Plan | null | undefined): string {
    const price = plan?.price_clp ?? 0;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(price);
  }

  private mapSubscription(row: any): BusinessSubscription | null {
    if (!row) return null;

    const plan = Array.isArray(row.plan) ? row.plan[0] ?? null : row.plan ?? null;

    return {
      status: row.status,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      trial_ends_at: row.trial_ends_at,
      cancelled_at: row.cancelled_at,
      plan: plan ? {
        ...this.mapPlan(plan),
      } : null,
    };
  }

  private mapPlan(row: any): Plan {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description ?? null,
      price_clp: row.price_clp,
      billing_period_days: row.billing_period_days,
      features: row.features ?? {},
    };
  }

  private canViewPlanFeatures(subscription: BusinessSubscription | null): boolean {
    const state = this.effectiveState(subscription);
    return state === 'active' || state === 'grace';
  }

  private gracePeriodEndsAt(subscription: BusinessSubscription | null): Date | null {
    const endsAt = this.parseDate(subscription?.ends_at);
    if (!endsAt) return null;

    const graceEndsAt = new Date(endsAt);
    graceEndsAt.setDate(graceEndsAt.getDate() + this.gracePeriodDays);
    return graceEndsAt;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
