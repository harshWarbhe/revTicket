import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  };
}

@Injectable({
  providedIn: 'root'
})
export class ShowtimeService {
  constructor(private http: HttpClient) {}

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

  getShowtimesByMovie(movieId: string, date?: string): Observable<Showtime[]> {
    let url = `${environment.apiUrl}/showtimes/movie/${movieId}`;
    if (date) {
      return this.http.get<Showtime[]>(url, { params: { date } });
    }
    return this.http.get<Showtime[]>(url);
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
}

