import { Injectable, signal } from '@angular/core';
import { defer, Observable, tap } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  pendingRequestsCount = signal(0);
  private readonly perPage = 10;

  constructor(private supabase: SupabaseService) { }

  getStats(): Observable<any> {
    return defer(async () => {
      const [
        businesses,
        activeBusinesses,
        users,
        appointments,
      ] = await Promise.all([
        this.count('businesses'),
        this.count('businesses', 'is_active', true),
        this.count('profiles'),
        this.count('appointments'),
      ]);

      return {
        success: true,
        data: {
          total_businesses: businesses,
          active_businesses: activeBusinesses,
          total_users: users,
          total_appointments: appointments,
        },
      };
    });
  }

  getBusinesses(page: number = 1): Observable<any> {
    return defer(async () => {
      const from = (page - 1) * this.perPage;
      const to = from + this.perPage - 1;

      const { data, count, error } = await this.supabase.client
        .from('businesses')
        .select(`
          *,
          owner:profiles!businesses_owner_id_fkey(name, email)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      return this.paginated(data ?? [], count ?? 0, page);
    });
  }

  getUsers(page: number = 1): Observable<any> {
    return defer(async () => {
      const from = (page - 1) * this.perPage;
      const to = from + this.perPage - 1;

      const result = await this.supabase.client
        .from('profiles')
        .select(`
          *,
          business:businesses!profiles_business_id_fkey(
            id,
            name,
            slug,
            description,
            phone,
            email,
            address,
            city,
            country,
            logo_url,
            is_active,
            created_at,
            updated_at,
            subscription:business_subscriptions(
              status,
              starts_at,
              ends_at,
              trial_ends_at,
              cancelled_at,
              plan:plans(code, name, price_clp)
            )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      let data = result.data;
      let count = result.count;

      if (result.error) {
        if (!this.isMissingSubscriptionSchema(result.error)) {
          throw new Error(result.error.message);
        }

        const fallback = await this.supabase.client
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);

        if (fallback.error) throw new Error(fallback.error.message);

        data = fallback.data;
        count = fallback.count;
      }

      return this.paginated((data ?? []).map(user => this.mapUserSubscription(user)), count ?? 0, page);
    });
  }

  getPendingRequestsCount(): Observable<any> {
    return defer(async () => {
      const [legacyPendingProfiles, pendingRegistrations, pendingSubscriptions] = await Promise.all([
        this.getLegacyPendingProfilesData(),
        this.countIn('registration_requests', 'status', ['pending_approval', 'pending_payment', 'instructions_sent']),
        this.countIn('subscription_requests', 'status', ['pending', 'instructions_sent']),
      ]);

      return {
        success: true,
        data: {
          pending_profiles: legacyPendingProfiles.length,
          pending_registrations: pendingRegistrations,
          pending_subscriptions: pendingSubscriptions,
          total: legacyPendingProfiles.length + pendingRegistrations + pendingSubscriptions,
        },
      };
    }).pipe(
      tap(res => this.pendingRequestsCount.set(res.data.total))
    );
  }

  getPendingProfiles(): Observable<any> {
    return defer(async () => {
      const data = await this.getLegacyPendingProfilesData();
      return { success: true, data };
    });
  }

  getRegistrationRequests(): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client
        .from('registration_requests')
        .select(`
          id,
          profile_id,
          requested_plan_code,
          requested_plan_id,
          status,
          approved_at,
          activation_deadline,
          payment_confirmed_at,
          instructions_sent_at,
          instructions_email_id,
          activation_email_sent_at,
          activation_email_id,
          cancelled_at,
          included_trial_days,
          purchased_period_days,
          plan_price_snapshot,
          admin_notes,
          created_at,
          profile:profiles!registration_requests_profile_id_fkey(name, email),
          requested_plan:plans!registration_requests_requested_plan_id_fkey(code, name, price_clp, billing_period_days)
        `)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return { success: true, data: (data ?? []).map(request => this.mapRegistrationRequest(request)) };
    });
  }

  getSubscriptionRequests(): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client
        .from('subscription_requests')
        .select(`
          id,
          business_id,
          profile_id,
          request_type,
          status,
          current_subscription_status,
          current_ends_at,
          remaining_days_snapshot,
          requested_period_days,
          notes,
          admin_notes,
          instructions_sent_at,
          instructions_email_id,
          completed_at,
          cancelled_at,
          created_at,
          profile:profiles!subscription_requests_profile_id_fkey(name, email),
          business:businesses!subscription_requests_business_id_fkey(name, slug),
          current_plan:plans!subscription_requests_current_plan_id_fkey(code, name, price_clp),
          requested_plan:plans!subscription_requests_requested_plan_id_fkey(code, name, price_clp, billing_period_days)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      return { success: true, data: (data ?? []).map(request => this.mapSubscriptionRequest(request)) };
    });
  }

  sendSubscriptionInstructions(requestId: number): Observable<any> {
    return defer(async () => {
      const { data: sessionData, error: sessionError } = await this.supabase.client.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error('Sesion no disponible. Vuelve a iniciar sesion.');
      }

      const { data, error } = await this.supabase.client.functions.invoke('send-subscription-instructions', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          request_id: requestId,
        },
      });

      if (error) throw new Error(await this.getFunctionErrorMessage(error));
      if (data?.error) throw new Error(data.error);

      return { success: true, data: data?.data };
    });
  }

  sendRegistrationPaymentInstructions(requestId: number): Observable<any> {
    return defer(async () => {
      const { data: sessionData, error: sessionError } = await this.supabase.client.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error('Sesion no disponible. Vuelve a iniciar sesion.');
      }

      const { data, error } = await this.supabase.client.functions.invoke('send-registration-payment-instructions', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          request_id: requestId,
        },
      });

      if (error) throw new Error(await this.getFunctionErrorMessage(error));
      if (data?.error) throw new Error(data.error);

      return { success: true, data: data?.data };
    });
  }

  sendRegistrationActivationEmail(requestId: number): Observable<any> {
    return defer(async () => {
      const { data: sessionData, error: sessionError } = await this.supabase.client.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error('Sesion no disponible. Vuelve a iniciar sesion.');
      }

      const { data, error } = await this.supabase.client.functions.invoke('send-registration-activation-email', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          request_id: requestId,
        },
      });

      if (error) throw new Error(await this.getFunctionErrorMessage(error));
      if (data?.error) throw new Error(data.error);

      return { success: true, data: data?.data };
    });
  }

  completeSubscriptionRequest(requestId: number, adminNotes?: string): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.rpc('complete_subscription_request', {
        target_request_id: requestId,
        target_admin_notes: adminNotes ?? null,
      });

      if (error) throw new Error(error.message);

      const result = Array.isArray(data) ? data[0] ?? null : data;
      return { success: true, data: result };
    });
  }

  cancelSubscriptionRequest(requestId: number, adminNotes?: string): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.rpc('cancel_subscription_request', {
        target_request_id: requestId,
        target_admin_notes: adminNotes ?? null,
      });

      if (error) throw new Error(error.message);
      return { success: true, data };
    });
  }

  approveTrialRegistrationRequest(requestId: number, adminNotes?: string): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.rpc('approve_trial_registration_request', {
        target_request_id: requestId,
        target_admin_notes: adminNotes ?? null,
      });

      if (error) throw new Error(error.message);
      return { success: true, data: this.mapRegistrationRequest(data) };
    });
  }

  completePaidRegistrationRequest(requestId: number, adminNotes?: string): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.rpc('complete_paid_registration_request', {
        target_request_id: requestId,
        target_admin_notes: adminNotes ?? null,
      });

      if (error) throw new Error(error.message);
      return { success: true, data: this.mapRegistrationRequest(data) };
    });
  }

  cancelRegistrationRequest(requestId: number, adminNotes?: string): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.rpc('cancel_registration_request', {
        target_request_id: requestId,
        target_admin_notes: adminNotes ?? null,
      });

      if (error) throw new Error(error.message);
      return { success: true, data: this.mapRegistrationRequest(data) };
    });
  }

  toggleBusinessStatus(id: number): Observable<any> {
    return defer(async () => {
      const { data: business, error: readError } = await this.supabase.client
        .from('businesses')
        .select('is_active')
        .eq('id', id)
        .single();

      if (readError || !business) throw new Error(readError?.message ?? 'No se encontro el negocio.');

      const { data, error } = await this.supabase.client
        .from('businesses')
        .update({ is_active: !business.is_active })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return { success: true, data };
    });
  }

  toggleUserStatus(id: string): Observable<any> {
    return defer(async () => {
      const { data: user, error: readError } = await this.supabase.client
        .from('profiles')
        .select('is_active')
        .eq('id', id)
        .single();

      if (readError || !user) throw new Error(readError?.message ?? 'No se encontro el usuario.');

      const { data, error } = await this.supabase.client.rpc('admin_set_profile_active', {
        target_profile_id: id,
        target_is_active: !user.is_active,
      });

      if (error) throw new Error(error.message);
      return { success: true, data };
    });
  }

  approveUser(id: string): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client.rpc('admin_set_profile_active', {
        target_profile_id: id,
        target_is_active: true,
      });

      if (error) throw new Error(error.message);
      return { success: true, data };
    });
  }

  deleteUser(id: string): Observable<any> {
    return defer(async () => {
      const { data: sessionData, error: sessionError } = await this.supabase.client.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        throw new Error('Sesion no disponible. Vuelve a iniciar sesion.');
      }

      const { data, error } = await this.supabase.client.functions.invoke('platform-admin-users', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          action: 'delete-user',
          user_id: id,
        },
      });

      if (error) throw new Error(await this.getFunctionErrorMessage(error));
      if (data?.error) throw new Error(data.error);

      return { success: true, data };
    });
  }

  getPlans(): Observable<any> {
    return defer(async () => {
      const { data, error } = await this.supabase.client
        .from('plans')
        .select('id, code, name, price_clp, billing_period_days')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw new Error(error.message);
      return { success: true, data: data ?? [] };
    });
  }

  extendTrialSubscription(businessId: number, days: number): Observable<any> {
    return defer(async () => {
      this.assertValidDays(days);

      const currentSubscription = await this.getBusinessSubscription(businessId);
      if (!currentSubscription || currentSubscription.status !== 'trialing') {
        throw new Error('La suscripcion actual no es una prueba gratuita.');
      }

      const baseEndsAt = this.parseDate(currentSubscription.ends_at) ?? new Date();
      const baseTrialEndsAt = this.parseDate(currentSubscription.trial_ends_at) ?? baseEndsAt;

      return this.saveBusinessSubscription(businessId, {
        status: 'trialing',
        starts_at: currentSubscription.starts_at,
        ends_at: this.addDays(baseEndsAt, days).toISOString(),
        trial_ends_at: this.addDays(baseTrialEndsAt, days).toISOString(),
        cancelled_at: null,
        notes: `Trial extendido ${days} dias por admin.`,
      });
    });
  }

  extendActiveSubscription(businessId: number, days: number): Observable<any> {
    return defer(async () => {
      this.assertValidDays(days);

      const currentSubscription = await this.getBusinessSubscription(businessId);
      if (!currentSubscription || currentSubscription.status !== 'active') {
        throw new Error('La suscripcion actual no esta activa.');
      }

      const now = new Date();
      const currentEndsAt = currentSubscription?.ends_at ? new Date(currentSubscription.ends_at) : null;
      const renewalBase = currentEndsAt && currentEndsAt.getTime() > now.getTime() ? currentEndsAt : now;

      return this.saveBusinessSubscription(businessId, {
        status: 'active',
        starts_at: currentSubscription.starts_at,
        ends_at: this.addDays(renewalBase, days).toISOString(),
        trial_ends_at: null,
        cancelled_at: null,
        notes: `Suscripcion extendida ${days} dias por admin.`,
      });
    });
  }

  changeBusinessSubscriptionPlan(businessId: number, planCode: string): Observable<any> {
    return defer(async () => {
      const plan = await this.getPlanByCode(planCode);
      const currentSubscription = await this.getBusinessSubscription(businessId);

      if (!currentSubscription) {
        throw new Error('No se encontro la suscripcion actual.');
      }

      const currentPlanName = currentSubscription.plan?.name ?? 'plan anterior';

      return this.saveBusinessSubscription(businessId, {
        plan_id: plan.id,
        status: currentSubscription.status,
        starts_at: currentSubscription.starts_at,
        ends_at: currentSubscription.ends_at,
        trial_ends_at: currentSubscription.trial_ends_at,
        cancelled_at: currentSubscription.cancelled_at ?? null,
        notes: `Plan cambiado de ${currentPlanName} a ${plan.name} por admin.`,
      });
    });
  }

  convertTrialToPlan(businessId: number, planCode: string, days: number): Observable<any> {
    return defer(async () => {
      this.assertValidDays(days);

      const plan = await this.getPlanByCode(planCode);
      const currentSubscription = await this.getBusinessSubscription(businessId);

      if (!currentSubscription || currentSubscription.status !== 'trialing') {
        throw new Error('La suscripcion actual no es una prueba gratuita.');
      }

      const now = new Date();

      return this.saveBusinessSubscription(businessId, {
        plan_id: plan.id,
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: this.addDays(now, days).toISOString(),
        trial_ends_at: null,
        cancelled_at: null,
        notes: `Trial convertido a ${plan.name} por ${days} dias por admin.`,
      });
    });
  }

  reactivateBusinessSubscription(businessId: number, planCode: string, days: number): Observable<any> {
    return defer(async () => {
      this.assertValidDays(days);

      const plan = await this.getPlanByCode(planCode);
      const now = new Date();

      return this.saveBusinessSubscription(businessId, {
        plan_id: plan.id,
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: this.addDays(now, days).toISOString(),
        trial_ends_at: null,
        cancelled_at: null,
        notes: `Suscripcion reactivada ${plan.name} por ${days} dias por admin.`,
      });
    });
  }

  private async getPlanByCode(planCode: string): Promise<any> {
    const { data, error } = await this.supabase.client
      .from('plans')
      .select('id, code, name, price_clp, billing_period_days')
      .eq('code', planCode)
      .eq('is_active', true)
      .single();

    if (error || !data) throw new Error(error?.message ?? 'No se encontro el plan.');
    return data;
  }

  private async getBusinessSubscription(businessId: number): Promise<any> {
    const { data, error } = await this.supabase.client
      .from('business_subscriptions')
      .select(`
        status,
        starts_at,
        ends_at,
        trial_ends_at,
        cancelled_at,
        plan:plans(code, name, price_clp)
      `)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return this.mapSubscription(data);
  }

  private async saveBusinessSubscription(businessId: number, payload: Record<string, unknown>): Promise<any> {
    const { data, error } = await this.supabase.client
      .from('business_subscriptions')
      .update(payload)
      .eq('business_id', businessId)
      .select(`
        status,
        starts_at,
        ends_at,
        trial_ends_at,
        cancelled_at,
        plan:plans(code, name, price_clp)
      `)
      .single();

    if (error) throw new Error(error.message);
    return { success: true, data: this.mapSubscription(data) };
  }

  private assertValidDays(days: number): void {
    if (!Number.isInteger(days) || days <= 0) {
      throw new Error('Ingresa una cantidad de dias mayor a 0.');
    }
  }

  private addDays(baseDate: Date, days: number): Date {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + days);
    return date;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async getFunctionErrorMessage(error: unknown): Promise<string> {
    const fallback = (error as { message?: string })?.message ?? 'No se pudo ejecutar la accion.';
    const response = (error as { context?: Response })?.context;

    if (!response) return fallback;

    try {
      const payload = await response.clone().json();
      return payload?.error ?? fallback;
    } catch {
      try {
        return await response.clone().text() || fallback;
      } catch {
        return fallback;
      }
    }
  }

  private async count(table: string, column?: string, value?: unknown): Promise<number> {
    let query = this.supabase.client
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (column) {
      query = query.eq(column, value);
    }

    const { count, error } = await query;
    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  private async countIn(table: string, column: string, values: unknown[]): Promise<number> {
    const { count, error } = await this.supabase.client
      .from(table)
      .select('*', { count: 'exact', head: true })
      .in(column, values);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  private async getLegacyPendingProfilesData(): Promise<any[]> {
    const [{ data: profiles, error: profilesError }, { data: registrationRequests, error: requestsError }] = await Promise.all([
      this.supabase.client
        .from('profiles')
        .select('id, name, email, role, business_id, is_active, created_at, updated_at')
        .eq('is_active', false)
        .order('created_at', { ascending: false }),
      this.supabase.client
        .from('registration_requests')
        .select('profile_id'),
    ]);

    if (profilesError) throw new Error(profilesError.message);
    if (requestsError) throw new Error(requestsError.message);

    const registrationProfileIds = new Set((registrationRequests ?? []).map(request => request.profile_id));
    return (profiles ?? []).filter(profile => !registrationProfileIds.has(profile.id));
  }

  private mapUserSubscription(user: any): any {
    const subscription = Array.isArray(user.business?.subscription)
      ? user.business.subscription[0] ?? null
      : user.business?.subscription ?? null;

    return {
      ...user,
      subscription: this.mapSubscription(subscription),
    };
  }

  private mapSubscription(subscription: any): any {
    if (!subscription) return null;

    const plan = Array.isArray(subscription?.plan)
      ? subscription.plan[0] ?? null
      : subscription?.plan ?? null;

    return {
      ...subscription,
      plan,
    };
  }

  private mapSubscriptionRequest(request: any): any {
    return {
      ...request,
      profile: Array.isArray(request.profile) ? request.profile[0] ?? null : request.profile ?? null,
      business: Array.isArray(request.business) ? request.business[0] ?? null : request.business ?? null,
      current_plan: Array.isArray(request.current_plan) ? request.current_plan[0] ?? null : request.current_plan ?? null,
      requested_plan: Array.isArray(request.requested_plan) ? request.requested_plan[0] ?? null : request.requested_plan ?? null,
    };
  }

  private mapRegistrationRequest(request: any): any {
    return {
      ...request,
      profile: Array.isArray(request.profile) ? request.profile[0] ?? null : request.profile ?? null,
      requested_plan: Array.isArray(request.requested_plan) ? request.requested_plan[0] ?? null : request.requested_plan ?? null,
    };
  }

  private isMissingSubscriptionSchema(error: any): boolean {
    const code = String(error?.code ?? '');
    const message = String(error?.message ?? '');

    return ['PGRST200', 'PGRST205', '42703'].includes(code)
      || message.includes('business_subscriptions')
      || message.includes('plans');
  }

  private paginated(data: any[], total: number, page: number): any {
    return {
      success: true,
      data: {
        data,
        current_page: page,
        last_page: Math.max(1, Math.ceil(total / this.perPage)),
        per_page: this.perPage,
        total,
      },
    };
  }
}
