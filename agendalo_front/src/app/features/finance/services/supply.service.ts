import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Supply {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface SupplyTransaction {
  id: number;
  supply_id: number;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchased_at: string;
  notes?: string;
  supply?: Supply;
}

@Injectable({
  providedIn: 'root'
})
export class SupplyService {
  private apiUrl = `${environment.apiUrl}/finance/supplies`;

  constructor(private http: HttpClient) {}

  // --- Catálogo Base ---
  getCatalog(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/catalog`);
  }

  createSupply(data: { name: string, description?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/catalog`, data);
  }

  // --- Historial de Compras ---
  getPurchases(page: number = 1): Observable<any> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<any>(`${this.apiUrl}/purchases`, { params });
  }

  registerPurchase(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/purchases`, data);
  }

  deletePurchase(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/purchases/${id}`);
  }
}
