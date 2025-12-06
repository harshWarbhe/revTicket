import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  screen: string;
  showDateTime: string;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  movie?: {
    id: string;
    title: string;
    genre?: string[];
    duration?: number;
    rating?: number;
    posterUrl?: string;
    language?: string;
  };
  theater?: {
    id: string;
    name: string;
    location?: string;
    address?: string;
    totalScreens?: number;
  };
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
export class ShowtimeService {
  private http = inject(HttpClient);

  getShowtimes(filters?: { movieId?: string; theaterId?: string; date?: string }): Observable<Showtime[]> {
    let params = new HttpParams();
    if (filters?.movieId) {
      params = params.set('movieId', filters.movieId);
    }
    if (filters?.theaterId) {
      params = params.set('theaterId', filters.theaterId);
    }
    if (filters?.date) {
      params = params.set('date', filters.date);
    }
    return this.http.get<Showtime[]>(`${environment.apiUrl}/showtimes`, { params });
  }

  getShowtimesByMovie(movieId: string, date?: string, city?: string): Observable<Showtime[]> {
    let params: any = {};
    if (date) params.date = date;
    if (city) params.city = city;
    return this.http.get<Showtime[]>(`${environment.apiUrl}/showtimes/movie/${movieId}`, { params });
  }

  getShowtimeById(id: string): Observable<Showtime> {
    return this.http.get<Showtime>(`${environment.apiUrl}/showtimes/${id}`);
  }

  createShowtime(showtime: Partial<Showtime>): Observable<Showtime> {
    return this.http.post<Showtime>(`${environment.apiUrl}/showtimes`, showtime);
  }

  updateShowtime(id: string, showtime: Partial<Showtime>): Observable<Showtime> {
    return this.http.put<Showtime>(`${environment.apiUrl}/showtimes/${id}`, showtime);
  }

  deleteShowtime(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/showtimes/${id}`);
  }

  getAllShowtimes(): Observable<Showtime[]> {
    return this.getShowtimes();
  }

  getAdminShowtimes(filters?: { movieId?: string; theaterId?: string; date?: string; search?: string }): Observable<Showtime[]> {
    let params = new HttpParams();
    if (filters?.movieId) {
      params = params.set('movieId', filters.movieId);
    }
    if (filters?.theaterId) {
      params = params.set('theaterId', filters.theaterId);
    }
    if (filters?.date) {
      params = params.set('date', filters.date);
    }
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    return this.http.get<Showtime[]>(`${environment.apiUrl}/admin/showtimes`, { params });
  }

  toggleShowtimeStatus(id: string): Observable<Showtime> {
    return this.http.patch<Showtime>(`${environment.apiUrl}/admin/showtimes/${id}/status`, {});
  }

  checkConflict(screenId: string, showDateTime: string, excludeShowId?: string): Observable<boolean> {
    let params = new HttpParams()
      .set('screenId', screenId)
      .set('showDateTime', showDateTime);
    if (excludeShowId) {
      params = params.set('excludeShowId', excludeShowId);
    }
    return this.http.get<{ conflict: boolean }>(`${environment.apiUrl}/admin/showtimes/check-conflict`, { params })
      .pipe(map(response => response.conflict));
  }
}

