import { Injectable } from '@angular/core';
import { defer, Observable } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
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

      const { data, count, error } = await this.supabase.client
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      return this.paginated(data ?? [], count ?? 0, page);
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

      const { data, error } = await this.supabase.client
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return { success: true, data };
    });
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
