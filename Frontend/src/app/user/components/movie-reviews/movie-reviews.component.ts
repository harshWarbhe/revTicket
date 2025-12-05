import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReviewService, ReviewRequest, ReviewResponse } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-movie-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movie-reviews.component.html',
  styleUrls: ['./movie-reviews.component.css']
})
export class MovieReviewsComponent implements OnInit {
  @Input() movieId!: string;
  
  reviews = signal<ReviewResponse[]>([]);
  averageRating = signal<number>(0);
  userRating = 0;
  userComment = '';
  showReviewForm = signal(false);
  isLoggedIn = signal(false);
  canReview = signal(false);
  Math = Math;

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoggedIn.set(this.authService.isAuthenticated());
    this.loadReviews();
    this.loadAverageRating();
    if (this.isLoggedIn()) {
      this.checkCanReview();
    }
  }

  checkCanReview() {
    this.reviewService.canReviewMovie(this.movieId).subscribe({
      next: (canReview) => this.canReview.set(canReview)
    });
  }

  loadReviews() {
    this.reviewService.getMovieReviews(this.movieId).subscribe({
      next: (reviews) => this.reviews.set(reviews)
    });
  }

  loadAverageRating() {
    this.reviewService.getAverageRating(this.movieId).subscribe({
      next: (rating) => this.averageRating.set(rating)
    });
  }

  submitReview() {
    if (!this.userRating || !this.userComment.trim()) {
      alert('Please provide both rating and comment');
      return;
    }

    const request: ReviewRequest = {
      movieId: this.movieId,
      rating: this.userRating,
      comment: this.userComment
    };

    this.reviewService.addReview(request).subscribe({
      next: () => {
        alert('Review submitted! It will be visible after admin approval.');
        this.userRating = 0;
        this.userComment = '';
        this.showReviewForm.set(false);
      },
      error: (err) => alert(err.error?.message || 'Failed to submit review')
    });
  }

  getStars(rating: number): string[] {
    return Array(5).fill('★').map((star, i) => i < rating ? '★' : '☆');
  }

  setRating(rating: number) {
    this.userRating = rating;
  }
}
