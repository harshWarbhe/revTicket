import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService, ReviewRequest, ReviewResponse } from '../../../core/services/review.service';
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
  protected authService = inject(AuthService);
  private alertService = inject(AlertService);
  
  protected readonly Math = Math;

  reviewForm!: FormGroup;
  reviews = signal<ReviewResponse[]>([]);
  averageRating = signal<number>(0);
  loading = signal(false);
  showReviewForm = signal(false);

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.maxLength(1000)]]
    });

    this.loadReviews();
    this.loadAverageRating();
  }

  loadReviews(): void {
    this.reviewService.getMovieReviews(this.movieId).subscribe({
      next: (reviews) => this.reviews.set(reviews),
      error: () => this.alertService.error('Failed to load reviews')
    });
  }

  loadAverageRating(): void {
    this.reviewService.getAverageRating(this.movieId).subscribe({
      next: (data) => this.averageRating.set(data.averageRating),
      error: () => {}
    });
  }

  onSubmitReview(): void {
    if (this.reviewForm.valid && this.authService.isAuthenticated()) {
      this.loading.set(true);
      
      const reviewData: ReviewRequest = {
        movieId: this.movieId,
        rating: this.reviewForm.value.rating,
        comment: this.reviewForm.value.comment
      };

      this.reviewService.addReview(reviewData).subscribe({
        next: () => {
          this.alertService.success('Review added successfully');
          this.reviewForm.reset({ rating: 5, comment: '' });
          this.showReviewForm.set(false);
          this.loadReviews();
          this.loadAverageRating();
          this.loading.set(false);
        },
        error: () => {
          this.alertService.error('Failed to add review');
          this.loading.set(false);
        }
      });
    }
  }

  getStars(rating: number): string[] {
    return Array(5).fill('').map((_, i) => i < rating ? '★' : '☆');
  }

  toggleReviewForm(): void {
    this.showReviewForm.set(!this.showReviewForm());
  }
}