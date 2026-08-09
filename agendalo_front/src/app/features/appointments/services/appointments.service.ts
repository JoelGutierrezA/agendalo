import { Injectable } from '@angular/core';
import { BusinessService } from '../../settings/services/business.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { GoogleCalendarService } from '../../settings/services/google-calendar.service';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface AppointmentRow {
  id: number;
  business_id: number;
  client_id: number | null;
  service_id: number | null;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: AppointmentStatus;
  notes: string | null;
  is_from_public: boolean;
  service?: { name: string; price: number | null } | null;
}

export interface AppointmentFilters {
  search?: string;
  status?: string;
  date?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface AppointmentPayload {
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  service_id: number;
  scheduled_at: string;
  status: AppointmentStatus;
  notes?: string | null;
}

export interface CalendarEvent {
  id: number | string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  extendedProps: {
    status: string;
    client_name: string;
    service_name: string;
    source?: 'skedia' | 'google';
    read_only?: boolean;
  };
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  constructor(
    private businessService: BusinessService,
    private supabase: SupabaseService,
    private googleCalendarService: GoogleCalendarService
  ) {}

  async list(filters: AppointmentFilters = {}): Promise<AppointmentRow[]> {
    const business = this.requireBusiness();
    let query = this.supabase.client
      .from('appointments')
      .select(`
        *,
        service:services(name, price)
      `)
      .eq('business_id', business.id);

    if (filters.search?.trim()) {
      const search = filters.search.trim();
      query = query.or(`client_name.ilike.%${search}%,client_email.ilike.%${search}%,client_phone.ilike.%${search}%`);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.date) {
      const start = new Date(`${filters.date}T00:00:00`);
      const end = new Date(`${filters.date}T00:00:00`);
      end.setDate(end.getDate() + 1);
      query = query.gte('scheduled_at', start.toISOString()).lt('scheduled_at', end.toISOString());
    }

    const sortBy = filters.sort_by === 'created_at' ? 'created_at' : 'scheduled_at';
    query = query.order(sortBy, { ascending: filters.sort_dir === 'asc' });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map(this.mapAppointment);
  }

  async calendar(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    const business = this.requireBusiness();
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);

    const { data, error } = await this.supabase.client
      .from('appointments')
      .select(`
        id,
        google_event_id,
        client_name,
        scheduled_at,
        duration_minutes,
        status,
        service:services(name)
      `)
      .eq('business_id', business.id)
      .gte('scheduled_at', start.toISOString())
      .lte('scheduled_at', end.toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(error.message);

    const internalEvents = (data ?? []).map((appointment: any) => {
      const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;
      const endAt = new Date(appointment.scheduled_at);
      endAt.setMinutes(endAt.getMinutes() + Number(appointment.duration_minutes ?? 0));

      return {
        id: appointment.id,
        title: `${appointment.client_name} - ${service?.name ?? 'Servicio'}`,
        start: appointment.scheduled_at,
        end: endAt.toISOString(),
        backgroundColor: this.getStatusColor(appointment.status),
        extendedProps: {
          status: appointment.status,
          client_name: appointment.client_name,
          service_name: service?.name ?? 'Servicio',
          source: 'skedia',
          read_only: false,
        },
      };
    });

    const googleEvents = await this.googleCalendarService.listEvents(
      start.toISOString(),
      end.toISOString(),
      (data ?? []).map((appointment: any) => appointment.google_event_id).filter(Boolean)
    ).catch(() => []);

    return [...internalEvents, ...googleEvents].sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  }

  async find(id: number): Promise<AppointmentRow> {
    const business = this.requireBusiness();
    const { data, error } = await this.supabase.client
      .from('appointments')
      .select(`
        *,
        service:services(name, price)
      `)
      .eq('id', id)
      .eq('business_id', business.id)
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Cita no encontrada.');
    return this.mapAppointment(data);
  }

  async create(payload: AppointmentPayload): Promise<AppointmentRow> {
    const business = this.requireBusiness();
    const service = await this.getService(payload.service_id, business.id);
    const clientId = await this.upsertClient(business.id, payload);

    await this.assertScheduleAvailable(
      business.id,
      payload.scheduled_at,
      service.duration_minutes
    );

    const { data, error } = await this.supabase.client
      .from('appointments')
      .insert({
        business_id: business.id,
        client_id: clientId,
        service_id: payload.service_id,
        client_name: payload.client_name,
        client_email: payload.client_email || null,
        client_phone: payload.client_phone || null,
        scheduled_at: payload.scheduled_at,
        duration_minutes: service.duration_minutes,
        status: payload.status,
        notes: payload.notes || null,
        is_from_public: false,
      })
      .select(`
        *,
        service:services(name, price)
      `)
      .single();

    if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la cita.');

    const appointment = this.mapAppointment(data);
    await this.registerCompletedIncome(appointment, null);
    await this.syncGoogle(appointment.id);
    return appointment;
  }

  async update(id: number, payload: AppointmentPayload): Promise<AppointmentRow> {
    const business = this.requireBusiness();
    const current = await this.find(id);
    const service = await this.getService(payload.service_id, business.id);
    const clientId = await this.upsertClient(business.id, payload);

    await this.assertScheduleAvailable(
      business.id,
      payload.scheduled_at,
      service.duration_minutes,
      id
    );

    const { data, error } = await this.supabase.client
      .from('appointments')
      .update({
        client_id: clientId,
        service_id: payload.service_id,
        client_name: payload.client_name,
        client_email: payload.client_email || null,
        client_phone: payload.client_phone || null,
        scheduled_at: payload.scheduled_at,
        duration_minutes: service.duration_minutes,
        status: payload.status,
        notes: payload.notes || null,
      })
      .eq('id', id)
      .eq('business_id', business.id)
      .select(`
        *,
        service:services(name, price)
      `)
      .single();

    if (error || !data) throw new Error(error?.message ?? 'No se pudo actualizar la cita.');

    const appointment = this.mapAppointment(data);
    await this.registerCompletedIncome(appointment, current.status);
    await this.syncGoogle(appointment.id);
    return appointment;
  }

  async updateStatus(appointment: AppointmentRow, status: AppointmentStatus): Promise<AppointmentRow> {
    const business = this.requireBusiness();
    const oldStatus = appointment.status;

    const { data, error } = await this.supabase.client
      .from('appointments')
      .update({
        status,
        cancelled_at: status === 'cancelled' ? new Date().toISOString() : null,
      })
      .eq('id', appointment.id)
      .eq('business_id', business.id)
      .select(`
        *,
        service:services(name, price)
      `)
      .single();

    if (error || !data) throw new Error(error?.message ?? 'No se pudo actualizar la cita.');

    const updated = this.mapAppointment(data);
    await this.registerCompletedIncome(updated, oldStatus);
    await this.syncGoogle(updated.id);
    return updated;
  }

  async syncPublicAppointment(appointmentId: number): Promise<void> {
    await this.googleCalendarService.syncPublicAppointment(appointmentId).catch(() => undefined);
  }

  private async getService(serviceId: number, businessId: number): Promise<{ duration_minutes: number; price: number }> {
    const { data, error } = await this.supabase.client
      .from('services')
      .select('duration_minutes, price')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .single();

    if (error || !data) throw new Error(error?.message ?? 'Servicio no encontrado.');

    return {
      duration_minutes: Number(data.duration_minutes),
      price: Number(data.price ?? 0),
    };
  }

  private async upsertClient(businessId: number, payload: AppointmentPayload): Promise<number | null> {
    const email = payload.client_email?.trim() || null;
    const phone = payload.client_phone?.trim() || null;

    let existing = null;
    if (email) {
      const { data, error } = await this.supabase.client
        .from('clients')
        .select('id')
        .eq('business_id', businessId)
        .eq('email', email)
        .maybeSingle();

      if (error) throw new Error(error.message);
      existing = data;
    } else if (phone) {
      const { data, error } = await this.supabase.client
        .from('clients')
        .select('id')
        .eq('business_id', businessId)
        .eq('phone', phone)
        .maybeSingle();

      if (error) throw new Error(error.message);
      existing = data;
    }

    if (existing?.id) {
      const { error } = await this.supabase.client
        .from('clients')
        .update({
          name: payload.client_name,
          email,
          phone,
        })
        .eq('id', existing.id)
        .eq('business_id', businessId);

      if (error) throw new Error(error.message);
      return existing.id;
    }

    const { data, error } = await this.supabase.client
      .from('clients')
      .insert({
        business_id: businessId,
        name: payload.client_name,
        email,
        phone,
      })
      .select('id')
      .single();

    if (error || !data) throw new Error(error?.message ?? 'No se pudo registrar el cliente.');
    return data.id;
  }

  private async assertScheduleAvailable(
    businessId: number,
    scheduledAt: string,
    durationMinutes: number,
    ignoreAppointmentId?: number
  ): Promise<void> {
    const start = new Date(scheduledAt);
    const dayStart = new Date(start);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const { data, error } = await this.supabase.client
      .from('appointments')
      .select('id, scheduled_at, duration_minutes, status')
      .eq('business_id', businessId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', dayStart.toISOString())
      .lt('scheduled_at', dayEnd.toISOString());

    if (error) throw new Error(error.message);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);

    const conflict = (data ?? []).some((appointment: any) => {
      if (ignoreAppointmentId && appointment.id === ignoreAppointmentId) return false;

      const otherStart = new Date(appointment.scheduled_at);
      const otherEnd = new Date(otherStart);
      otherEnd.setMinutes(otherEnd.getMinutes() + Number(appointment.duration_minutes ?? 0));

      return start < otherEnd && end > otherStart;
    });

    if (conflict) {
      throw new Error('Este horario ya esta reservado. Elige otro turno disponible.');
    }
  }

  private async registerCompletedIncome(appointment: AppointmentRow, previousStatus: AppointmentStatus | null): Promise<void> {
    if (appointment.status !== 'completed' || previousStatus === 'completed') return;

    const amount = Number(appointment.service?.price ?? 0);
    if (amount <= 0) return;

    const { data: existing, error: existingError } = await this.supabase.client
      .from('income_records')
      .select('id')
      .eq('appointment_id', appointment.id)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);
    if (existing) return;

    const { error } = await this.supabase.client
      .from('income_records')
      .insert({
        business_id: appointment.business_id,
        appointment_id: appointment.id,
        description: `Cita #${appointment.id} - ${appointment.client_name}`,
        amount,
        recorded_at: new Date().toISOString().slice(0, 10),
      });

    if (error) throw new Error(error.message);
  }

  private async syncGoogle(appointmentId: number): Promise<void> {
    await this.googleCalendarService.syncAppointment(appointmentId).catch(() => undefined);
  }

  private mapAppointment(row: any): AppointmentRow {
    return {
      ...row,
      service: Array.isArray(row.service) ? row.service[0] : row.service,
    };
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      confirmed: '#3B82F6',
      pending: '#F59E0B',
      completed: '#10B981',
      cancelled: '#EF4444',
      no_show: '#94A3B8',
    };
    return colors[status] ?? '#94A3B8';
  }

  private requireBusiness() {
    const business = this.businessService.currentBusiness();
    if (!business) throw new Error('No hay un negocio seleccionado.');
    return business;
  }
}
