import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);

  addReview(review: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${environment.apiUrl}/reviews`, review);
  }

  getMovieReviews(movieId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${environment.apiUrl}/reviews/movie/${movieId}`);
  }

  getAverageRating(movieId: string): Observable<{averageRating: number}> {
    return this.http.get<{averageRating: number}>(`${environment.apiUrl}/reviews/movie/${movieId}/average`);
  }
}