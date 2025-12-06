import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Movie, Showtime } from '../models/movie.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private http = inject(HttpClient);

  getMovies(city?: string): Observable<Movie[]> {
    const params: Record<string, string> = {};
    if (city) params['city'] = city;
    return this.http.get<Movie[]>(`${environment.apiUrl}/movies`, { params });
  }

  getAdminMovies(): Observable<Movie[]> {
    return this.http.get<ApiResponse<Movie[]>>(`${environment.apiUrl}/admin/movies`)
      .pipe(map(response => response.data));
  }

  getMovieById(id: string): Observable<Movie> {
    return this.http.get<Movie>(`${environment.apiUrl}/movies/${id}`);
  }

  getAdminMovieById(id: string): Observable<Movie> {
    return this.http.get<ApiResponse<Movie>>(`${environment.apiUrl}/admin/movies/${id}`)
      .pipe(map(response => response.data));
  }

  getShowtimes(movieId: string, date?: string, city?: string): Observable<Showtime[]> {
    let params: any = {};
    if (date) params.date = date;
    if (city) params.city = city;
    return this.http.get<Showtime[]>(`${environment.apiUrl}/showtimes/movie/${movieId}`, { params });
  }

  addMovie(movie: Partial<Movie>): Observable<Movie> {
    return this.http.post<ApiResponse<Movie>>(`${environment.apiUrl}/admin/movies`, movie)
      .pipe(map(response => response.data));
  }

  updateMovie(id: string, movie: Partial<Movie>): Observable<Movie> {
    return this.http.put<ApiResponse<Movie>>(`${environment.apiUrl}/admin/movies/${id}`, movie)
      .pipe(map(response => response.data));
  }

  toggleMovieStatus(id: string): Observable<Movie> {
    return this.http.patch<ApiResponse<Movie>>(`${environment.apiUrl}/admin/movies/${id}/status`, {})
      .pipe(map(response => response.data));
  }

  deleteMovie(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/admin/movies/${id}`)
      .pipe(map(() => undefined));
  }

  getAllGenres(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${environment.apiUrl}/admin/movies/genres`)
      .pipe(map(response => response.data));
  }

  getAllRatings(): Observable<number[]> {
    return this.http.get<ApiResponse<number[]>>(`${environment.apiUrl}/admin/movies/ratings`)
      .pipe(map(response => response.data));
  }
}