import { Injectable } from '@angular/core';
import { defer, map, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';

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
    return defer(() => this.invoke<{ auth_url: string }>('auth-url')).pipe(
      map(data => data.auth_url)
    );
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
}
