import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlatformService {
  private readonly apiUrl = `${environment.apiUrl}/admin/platform`;

  constructor(private http: HttpClient) { }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getBusinesses(page: number = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/businesses`, { params: { page: page.toString() } });
  }

  getUsers(page: number = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/users`, { params: { page: page.toString() } });
  }

  toggleBusinessStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/businesses/${id}/toggle-status`, {});
  }

  toggleUserStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${id}/toggle-status`, {});
  }
}
