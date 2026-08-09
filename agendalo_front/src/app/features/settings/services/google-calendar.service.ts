import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
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
  private readonly apiUrl = `${environment.apiUrl}/google`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<GoogleCalendarStatus> {
    return this.http.get<{ data: GoogleCalendarStatus }>(`${this.apiUrl}/status`).pipe(
      map(res => res.data)
    );
  }

  getAuthUrl(): Observable<string> {
    return this.http.get<{ data: { auth_url: string } }>(`${this.apiUrl}/auth-url`).pipe(
      map(res => res.data.auth_url)
    );
  }

  disconnect(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/disconnect`);
  }
}
