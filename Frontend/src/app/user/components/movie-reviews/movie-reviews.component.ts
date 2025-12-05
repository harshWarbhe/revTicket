import { Component, Input, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService, Review, ReviewRequest, MovieRating } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-movie-reviews',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movie-reviews.component.html',
  styleUrls: ['./movie-reviews.component.css']
})
export class MovieReviewsComponent implements OnInit {
  @Input() movieId!: string;

  private fb = inject(FormBuilder);
  private reviewService = inject(ReviewService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  reviews = signal<Review[]>([]);
  movieRating = signal<MovieRating>({ averageRating: 0, reviewCount: 0 });
  loading = signal(false);
  submitting = signal(false);
  showReviewForm = signal(false);
  canReview = signal(false);

  reviewForm: FormGroup;

  constructor() {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    if (this.movieId) {
      this.loadReviews();
      this.loadMovieRating();
      this.checkCanReview();
    }
  }

  loadReviews(): void {
    this.loading.set(true);
    this.reviewService.getMovieReviews(this.movieId).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadMovieRating(): void {
    this.reviewService.getMovieRating(this.movieId).subscribe({
      next: (rating) => {
        this.movieRating.set(rating);
      },
      error: () => {}
    });
  }

  toggleReviewForm(): void {
    if (!this.authService.isAuthenticated()) {
      this.alertService.error('Please login to write a review');
      return;
    }
    if (!this.canReview()) {
      this.alertService.error('You can only review movies after watching them');
      return;
    }
    this.showReviewForm.set(!this.showReviewForm());
  }

  submitReview(): void {
    if (this.reviewForm.valid) {
      this.submitting.set(true);
      const request: ReviewRequest = {
        movieId: this.movieId,
        rating: this.reviewForm.value.rating,
        comment: this.reviewForm.value.comment
      };

      console.log('Submitting review:', request);
      this.reviewService.addReview(request).subscribe({
        next: (response) => {
          console.log('Review submitted:', response);
          this.alertService.success('Review submitted successfully!');
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.showReviewForm.set(false);
          this.loadReviews();
          this.loadMovieRating();
          this.submitting.set(false);
        },
        error: (error) => {
          console.error('Review submission error:', error);
          this.alertService.error('Failed to submit review: ' + (error.error?.message || 'Unknown error'));
          this.submitting.set(false);
        }
      });
    }
  }

  getStarArray(rating: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < rating);
  }

  getStarClass(index: number, rating: number): string {
    return index < rating ? 'star filled' : 'star';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating: rating });
  }

  checkCanReview(): void {
    if (this.authService.isAuthenticated()) {
      this.reviewService.canUserReviewMovie(this.movieId).subscribe({
        next: (canReview) => {
          this.canReview.set(canReview);
        },
        error: () => {
          this.canReview.set(false);
        }
      });
    }
  }
}