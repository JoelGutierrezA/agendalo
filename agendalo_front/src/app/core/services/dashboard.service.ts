import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { BusinessService } from '../../features/settings/services/business.service';
import { SupabaseService } from './supabase.service';

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
  constructor(
    private businessService: BusinessService,
    private supabase: SupabaseService
  ) { }

  getSummary(): Observable<DashboardSummary> {
    return defer(async () => {
      const business = this.businessService.currentBusiness();
      if (!business) {
        throw new Error('No hay un negocio seleccionado.');
      }

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const [
        monthlyIncome,
        monthlyExpenses,
        todayAppointments,
        pendingAppointments,
        upcomingAppointments,
        weeklyAppointments,
        weeklyIncome,
      ] = await Promise.all([
        this.sumAmount('income_records', business.id, monthStart, nextMonthStart),
        this.sumAmount('expense_records', business.id, monthStart, nextMonthStart),
        this.countAppointments(business.id, todayStart, tomorrowStart),
        this.countPendingAppointments(business.id),
        this.getUpcomingAppointments(business.id, now),
        this.getWeeklyAppointments(business.id, weekStart),
        this.getWeeklyIncome(business.id, weekStart),
      ]);

      const chart = this.buildWeeklyChart(weekStart, weeklyAppointments, weeklyIncome);

      return {
        kpis: {
          monthly_income: monthlyIncome,
          monthly_expenses: monthlyExpenses,
          monthly_balance: monthlyIncome - monthlyExpenses,
          today_appointments: todayAppointments,
          pending_appointments: pendingAppointments,
        },
        upcoming_appointments: upcomingAppointments,
        chart_data: chart,
      };
    });
  }

  private async sumAmount(table: 'income_records' | 'expense_records', businessId: number, from: Date, to: Date): Promise<number> {
    const { data, error } = await this.supabase.client
      .from(table)
      .select('amount')
      .eq('business_id', businessId)
      .gte('recorded_at', this.toDateOnly(from))
      .lt('recorded_at', this.toDateOnly(to));

    if (error) throw new Error(error.message);

    return (data ?? []).reduce((sum, row: any) => sum + Number(row.amount ?? 0), 0);
  }

  private async countAppointments(businessId: number, from: Date, to: Date): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .gte('scheduled_at', from.toISOString())
      .lt('scheduled_at', to.toISOString());

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  private async countPendingAppointments(businessId: number): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  private async getUpcomingAppointments(businessId: number, from: Date): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('appointments')
      .select(`
        id,
        client_name,
        scheduled_at,
        status,
        service:services(name, price)
      `)
      .eq('business_id', businessId)
      .gte('scheduled_at', from.toISOString())
      .in('status', ['pending', 'confirmed'])
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (error) throw new Error(error.message);

    return (data ?? []).map((appointment: any) => ({
      id: appointment.id,
      client_name: appointment.client_name,
      service_name: appointment.service?.name ?? 'Cita personalizada',
      service_price: Number(appointment.service?.price ?? 0),
      scheduled_at: appointment.scheduled_at,
      date: new Date(appointment.scheduled_at).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      status: appointment.status,
      time: new Date(appointment.scheduled_at).toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  }

  private async getWeeklyAppointments(businessId: number, from: Date): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('appointments')
      .select('scheduled_at')
      .eq('business_id', businessId)
      .gte('scheduled_at', from.toISOString());

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  private async getWeeklyIncome(businessId: number, from: Date): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('income_records')
      .select('recorded_at, amount')
      .eq('business_id', businessId)
      .gte('recorded_at', this.toDateOnly(from));

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  private buildWeeklyChart(from: Date, appointments: any[], income: any[]): DashboardSummary['chart_data'] {
    const labels: string[] = [];
    const appointmentCounts: number[] = [];
    const incomeTotals: number[] = [];

    for (let index = 0; index < 7; index += 1) {
      const day = new Date(from);
      day.setDate(from.getDate() + index);
      const key = this.toDateOnly(day);

      labels.push(day.toLocaleDateString('es-CL', { weekday: 'short' }));

      appointmentCounts.push(
        appointments.filter(item => this.toDateOnly(new Date(item.scheduled_at)) === key).length
      );

      incomeTotals.push(
        income
          .filter(item => item.recorded_at === key)
          .reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
      );
    }

    return {
      labels,
      income: incomeTotals,
      appointments: appointmentCounts,
    };
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
