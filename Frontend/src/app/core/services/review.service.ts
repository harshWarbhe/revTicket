import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ReviewRequest {
  movieId: string;
  rating: number;
  comment: string;
}

export interface ReviewResponse {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved: boolean;
  movieId?: string;
  movieTitle?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  addReview(request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.apiUrl}/reviews`, request);
  }

  getMovieReviews(movieId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.apiUrl}/reviews/movie/${movieId}`);
  }

  getAverageRating(movieId: string): Observable<number> {
    return this.http.get<{ averageRating: number }>(`${this.apiUrl}/reviews/movie/${movieId}/average`)
      .pipe(map(response => response.averageRating));
  }

  getPendingReviews(): Observable<ReviewResponse[]> {
    return this.http.get<ApiResponse<ReviewResponse[]>>(`${this.apiUrl}/admin/reviews/pending`)
      .pipe(map(response => response.data));
  }

  getAllMovieReviews(movieId: string): Observable<ReviewResponse[]> {
    return this.http.get<ApiResponse<ReviewResponse[]>>(`${this.apiUrl}/admin/reviews/movie/${movieId}`)
      .pipe(map(response => response.data));
  }

  approveReview(reviewId: string): Observable<ReviewResponse> {
    return this.http.patch<ApiResponse<ReviewResponse>>(`${this.apiUrl}/admin/reviews/${reviewId}/approve`, {})
      .pipe(map(response => response.data));
  }

  deleteReview(reviewId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/admin/reviews/${reviewId}`)
      .pipe(map(() => undefined));
  }

  getAllReviews(): Observable<ReviewResponse[]> {
    return this.http.get<ApiResponse<ReviewResponse[]>>(`${this.apiUrl}/admin/reviews`)
      .pipe(map(response => response.data));
  }

  canReviewMovie(movieId: string): Observable<boolean> {
    return this.http.get<{ canReview: boolean }>(`${this.apiUrl}/reviews/can-review/${movieId}`)
      .pipe(map(response => response.canReview));
  }
}
