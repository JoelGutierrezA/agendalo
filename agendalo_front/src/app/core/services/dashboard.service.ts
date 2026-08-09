import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface DashboardSummary {
  kpis: {
    monthly_income: number;
    monthly_expenses: number;
    monthly_balance: number;
    today_appointments: number;
    pending_appointments: number;
  };
  upcoming_appointments: any[];
  chart_data: {
    labels: string[];
    income: number[];
    appointments: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) { }

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<any>(`${this.apiUrl}/summary`).pipe(
      map(res => res.data)
    );
  }
}
