import { Injectable } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class TheaterService {
  constructor(private http: HttpClient) {}

  getAllTheaters(activeOnly: boolean = true): Observable<Theater[]> {
    let params = new HttpParams();
    if (!activeOnly) {
      params = params.set('activeOnly', 'false');
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
}

