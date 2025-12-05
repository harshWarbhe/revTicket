import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Review {
  id: string;
  movieId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRequest {
  movieId: string;
  rating: number;
  comment?: string;
}

export interface MovieRating {
  averageRating: number;
  reviewCount: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);

  addReview(request: ReviewRequest): Observable<Review> {
    return this.http.post<ApiResponse<Review>>(`${environment.apiUrl}/reviews`, request)
      .pipe(map(response => response.data));
  }

  getMovieReviews(movieId: string): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${environment.apiUrl}/reviews/movie/${movieId}`)
      .pipe(map(response => response.data));
  }

  getMovieRating(movieId: string): Observable<MovieRating> {
    return this.http.get<ApiResponse<MovieRating>>(`${environment.apiUrl}/reviews/movie/${movieId}/rating`)
      .pipe(map(response => response.data));
  }

  getUserReviews(): Observable<Review[]> {
    return this.http.get<ApiResponse<Review[]>>(`${environment.apiUrl}/reviews/user`)
      .pipe(map(response => response.data));
  }

  deleteReview(reviewId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/reviews/${reviewId}`)
      .pipe(map(() => undefined));
  }

  canUserReviewMovie(movieId: string): Observable<boolean> {
    return this.http.get<ApiResponse<boolean>>(`${environment.apiUrl}/user/bookings/can-review/${movieId}`)
      .pipe(map(response => response.data));
  }
}