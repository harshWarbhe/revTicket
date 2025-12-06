import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Theater {
  id: string;
  name: string;
  location: string;
  address: string;
  totalScreens?: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface Screen {
  id: string;
  name: string;
  totalSeats: number;
  theaterId: string;
}

@Injectable({
  providedIn: 'root'
})
export class TheaterService {
  private http = inject(HttpClient);

  getAllTheaters(activeOnly: boolean = true, city?: string): Observable<Theater[]> {
    let params = new HttpParams();
    if (!activeOnly) {
      params = params.set('activeOnly', 'false');
    }
    if (city) {
      params = params.set('city', city);
    }
    return this.http.get<Theater[]>(`${environment.apiUrl}/theaters`, { params });
  }

  getTheaterById(id: string): Observable<Theater> {
    return this.http.get<Theater>(`${environment.apiUrl}/theaters/${id}`);
  }

  createTheater(theater: Partial<Theater>): Observable<Theater> {
    return this.http.post<Theater>(`${environment.apiUrl}/theaters`, theater);
  }

  updateTheater(id: string, theater: Partial<Theater>): Observable<Theater> {
    return this.http.put<Theater>(`${environment.apiUrl}/theaters/${id}`, theater);
  }

  updateTheaterStatus(id: string, isActive: boolean): Observable<Theater> {
    const params = new HttpParams().set('active', String(isActive));
    return this.http.patch<Theater>(`${environment.apiUrl}/theaters/${id}/status`, null, { params });
  }

  deleteTheater(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/theaters/${id}`);
  }

  getTheaterScreens(theaterId: string): Observable<Screen[]> {
    return this.http.get<Screen[]>(`${environment.apiUrl}/admin/theaters/${theaterId}/screens`);
  }

  getAdminTheaters(activeOnly: boolean = false): Observable<Theater[]> {
    let params = new HttpParams();
    if (activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<Theater[]>(`${environment.apiUrl}/theaters`, { params });
  }
}

