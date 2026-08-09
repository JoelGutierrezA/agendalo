import { Injectable, signal } from '@angular/core';
import { defer, from, map, Observable, tap } from 'rxjs';
import { ApiResponse, Business, BusinessSettings } from '../../../models/auth.models';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

const BUSINESS_KEY = 'skedia_business';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  currentBusiness = signal<Business | null>(this.getStoredBusiness());

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService
  ) {}

  getBusiness(): Observable<ApiResponse<Business>> {
    return defer(async () => {
      const user = this.authService.currentUser();
      const businessId = user?.business_id;

      if (!businessId) {
        throw new Error('El usuario aun no tiene un negocio configurado.');
      }

      const { data, error } = await this.supabase.client
        .from('businesses')
        .select(`
          *,
          category:categories(*),
          settings:business_settings(*)
        `)
        .eq('id', businessId)
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'No se pudo cargar el negocio.');
      }

      return this.wrap(this.mapBusiness(data));
    }).pipe(
      tap(res => this.saveBusiness(res.data))
    );
  }

  createBusiness(payload: Partial<Business>): Observable<ApiResponse<Business>> {
    return defer(async () => {
      const { data: authData, error: authError } = await this.supabase.client.auth.getUser();
      const authUser = authData.user;

      if (authError || !authUser) {
        throw new Error(authError?.message ?? 'Sesion no disponible.');
      }

      const { data: business, error: businessError } = await this.supabase.client
        .from('businesses')
        .insert({
          owner_id: authUser.id,
          category_id: payload.category_id ?? null,
          name: payload.name,
          slug: payload.slug,
          description: payload.description ?? null,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          address: payload.address ?? null,
          city: payload.city ?? null,
          country: payload.country ?? 'Chile',
          logo_url: payload.logo_url ?? null,
          is_active: true,
        })
        .select('*')
        .single();

      if (businessError || !business) {
        throw new Error(businessError?.message ?? 'No se pudo crear el negocio.');
      }

      const { error: profileError } = await this.supabase.client
        .from('profiles')
        .update({ business_id: business.id })
        .eq('id', authUser.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      await this.createDefaultSettings(business.id);
      await this.createDefaultOpeningHours(business.id);

      this.authService.setCurrentUserBusinessId(business.id);

      const mapped = this.mapBusiness({
        ...business,
        category: null,
        settings: {
          booking_advance_days: 30,
          min_booking_notice_hours: 1,
          allow_public_booking: true,
          booking_confirmation_required: false,
          send_client_calendar_invite: true,
          time_zone: 'America/Santiago',
          currency: 'CLP',
        },
      });

      return this.wrap(mapped);
    }).pipe(
      tap(res => this.saveBusiness(res.data))
    );
  }

  updateBusiness(payload: Partial<Business>): Observable<ApiResponse<Business>> {
    return defer(async () => {
      const business = this.requireCurrentBusiness();

      const { data, error } = await this.supabase.client
        .from('businesses')
        .update({
          category_id: payload.category_id ?? business.category_id ?? null,
          name: payload.name ?? business.name,
          slug: payload.slug ?? business.slug,
          description: payload.description ?? null,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          address: payload.address ?? null,
          city: payload.city ?? null,
          country: payload.country ?? business.country,
          logo_url: payload.logo_url ?? null,
        })
        .eq('id', business.id)
        .select(`
          *,
          category:categories(*),
          settings:business_settings(*)
        `)
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'No se pudo actualizar el negocio.');
      }

      return this.wrap(this.mapBusiness(data));
    }).pipe(
      tap(res => this.saveBusiness(res.data))
    );
  }

  getCategories(): Observable<ApiResponse<any[]>> {
    return from(
      this.supabase.client
        .from('categories')
        .select('*')
        .order('name')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(error.message);
        return this.wrap(data ?? []);
      })
    );
  }

  getOpeningHours(): Observable<ApiResponse<any[]>> {
    return defer(async () => {
      const business = this.requireCurrentBusiness();

      const { data, error } = await this.supabase.client
        .from('opening_hours')
        .select('*')
        .eq('business_id', business.id)
        .order('day_of_week');

      if (error) throw new Error(error.message);
      return this.wrap(data ?? []);
    });
  }

  updateOpeningHours(hours: any[]): Observable<ApiResponse<void>> {
    return defer(async () => {
      const business = this.requireCurrentBusiness();
      const rows = hours.map(hour => ({
        business_id: business.id,
        day_of_week: hour.day_of_week,
        is_open: hour.is_open,
        open_time: hour.is_open ? hour.open_time : null,
        close_time: hour.is_open ? hour.close_time : null,
      }));

      const { error } = await this.supabase.client
        .from('opening_hours')
        .upsert(rows, { onConflict: 'business_id,day_of_week' });

      if (error) throw new Error(error.message);
      return this.wrap(undefined);
    });
  }

  getSettings(): Observable<ApiResponse<BusinessSettings>> {
    return defer(async () => {
      const business = this.requireCurrentBusiness();

      const { data, error } = await this.supabase.client
        .from('business_settings')
        .select('*')
        .eq('business_id', business.id)
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'No se pudo cargar la configuracion.');
      }

      return this.wrap(this.mapSettings(data));
    });
  }

  updateSettings(payload: Partial<BusinessSettings>): Observable<ApiResponse<BusinessSettings>> {
    return defer(async () => {
      const business = this.requireCurrentBusiness();

      const { data, error } = await this.supabase.client
        .from('business_settings')
        .update(payload)
        .eq('business_id', business.id)
        .select('*')
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'No se pudo actualizar la configuracion.');
      }

      const current = this.currentBusiness();
      if (current) {
        this.saveBusiness({ ...current, settings: this.mapSettings(data) });
      }

      return this.wrap(this.mapSettings(data));
    });
  }

  hasBusiness(): boolean {
    return !!this.currentBusiness();
  }

  setBusiness(business: Business): void {
    this.saveBusiness(business);
  }

  clearBusiness(): void {
    localStorage.removeItem(BUSINESS_KEY);
    this.currentBusiness.set(null);
  }

  private async createDefaultSettings(businessId: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('business_settings')
      .insert({
        business_id: businessId,
        booking_advance_days: 30,
        min_booking_notice_hours: 1,
        allow_public_booking: true,
        booking_confirmation_required: false,
        send_client_calendar_invite: true,
        time_zone: 'America/Santiago',
        currency: 'CLP',
      });

    if (error) throw new Error(error.message);
  }

  private async createDefaultOpeningHours(businessId: number): Promise<void> {
    const rows: any[] = [1, 2, 3, 4, 5].map(day => ({
      business_id: businessId,
      day_of_week: day,
      is_open: true,
      open_time: '09:00',
      close_time: '18:00',
    }));

    rows.push(
      { business_id: businessId, day_of_week: 0, is_open: false, open_time: null, close_time: null },
      { business_id: businessId, day_of_week: 6, is_open: false, open_time: null, close_time: null }
    );

    const { error } = await this.supabase.client
      .from('opening_hours')
      .insert(rows);

    if (error) throw new Error(error.message);
  }

  private saveBusiness(business: Business): void {
    localStorage.setItem(BUSINESS_KEY, JSON.stringify(business));
    this.currentBusiness.set(business);
  }

  private getStoredBusiness(): Business | null {
    try {
      const raw = localStorage.getItem(BUSINESS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private requireCurrentBusiness(): Business {
    const business = this.currentBusiness();
    if (!business) {
      throw new Error('No hay un negocio seleccionado.');
    }
    return business;
  }

  private mapBusiness(row: any): Business {
    return {
      id: row.id,
      user_id: row.owner_id,
      category_id: row.category_id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      phone: row.phone,
      email: row.email,
      address: row.address,
      city: row.city,
      country: row.country,
      logo_url: row.logo_url,
      is_active: row.is_active,
      category: row.category ?? undefined,
      settings: row.settings ? this.mapSettings(row.settings) : undefined,
    };
  }

  private mapSettings(row: any): BusinessSettings {
    return {
      booking_advance_days: row.booking_advance_days,
      min_booking_notice_hours: row.min_booking_notice_hours,
      allow_public_booking: row.allow_public_booking,
      booking_confirmation_required: row.booking_confirmation_required,
      send_client_calendar_invite: row.send_client_calendar_invite,
      time_zone: row.time_zone,
      currency: row.currency,
    };
  }

  private wrap<T>(data: T): ApiResponse<T> {
    return { success: true, data };
  }
}
