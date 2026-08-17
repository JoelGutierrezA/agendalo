import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { environment } from '../../../../environments/environment';

export interface GoogleCalendarStatus {
  connected: boolean;
  google_email: string | null;
  expires_at: string | null;
  is_expired: boolean;
  calendar_id: string | null;
}

@Injectable({ providedIn: 'root' })
export class GoogleCalendarService {
  constructor(private supabase: SupabaseService) {}

  getStatus(): Observable<GoogleCalendarStatus> {
    return defer(() => this.invoke<GoogleCalendarStatus>('status'));
  }

  getAuthUrl(): Observable<string> {
    return defer(() => this.buildAuthRedirectUrl());
  }

  disconnect(): Observable<void> {
    return defer(async () => {
      await this.invoke('disconnect');
    });
  }

  async syncAppointment(appointmentId: number): Promise<void> {
    await this.invoke('sync-appointment', { appointment_id: appointmentId });
  }

  async syncPublicAppointment(appointmentId: number): Promise<void> {
    await this.invoke('sync-public-appointment', { appointment_id: appointmentId });
  }

  async listEvents(start: string, end: string, excludeGoogleEventIds: string[] = []): Promise<any[]> {
    return this.invoke<any[]>('list-events', {
      start,
      end,
      exclude_google_event_ids: excludeGoogleEventIds,
    });
  }

  private async invoke<T = unknown>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
    const { data, error } = await this.supabase.client.functions.invoke('google-calendar', {
      body: { action, ...payload },
    });

    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);

    return data?.data as T;
  }

  private async buildAuthRedirectUrl(): Promise<string> {
    const { data, error } = await this.supabase.client.auth.getSession();
    const accessToken = data.session?.access_token;

    if (error || !accessToken) {
      throw new Error('Sesion no disponible.');
    }

    const baseUrl = `${environment.supabaseUrl.replace(/\/$/, '')}/functions/v1/google-calendar/auth`;
    return `${baseUrl}?token=${encodeURIComponent(accessToken)}`;
  }
}
