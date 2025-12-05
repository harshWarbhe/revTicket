import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService, ReviewResponse } from '../../../core/services/review.service';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit {
  allReviews = signal<ReviewResponse[]>([]);
  pendingReviews = signal<ReviewResponse[]>([]);
  loading = signal(false);
  activeTab = signal<'all' | 'pending'>('all');

  constructor(private reviewService: ReviewService) {}

  ngOnInit() {
    this.loadAllReviews();
  }

  loadAllReviews() {
    this.loading.set(true);
    this.reviewService.getAllReviews().subscribe({
      next: (reviews) => {
        this.allReviews.set(reviews);
        this.pendingReviews.set(reviews.filter(r => !r.approved));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  get displayedReviews() {
    return this.activeTab() === 'all' ? this.allReviews() : this.pendingReviews();
  }

  approveReview(reviewId: string) {
    this.reviewService.approveReview(reviewId).subscribe({
      next: () => {
        this.allReviews.update(reviews => 
          reviews.map(r => r.id === reviewId ? { ...r, approved: true } : r)
        );
        this.pendingReviews.update(reviews => 
          reviews.filter(r => r.id !== reviewId)
        );
      }
    });
  }

  deleteReview(reviewId: string) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.allReviews.update(reviews => 
            reviews.filter(r => r.id !== reviewId)
          );
          this.pendingReviews.update(reviews => 
            reviews.filter(r => r.id !== reviewId)
          );
        }
      });
    }
  }

  getStars(rating: number): string[] {
    return Array(5).fill('★').map((star, i) => i < rating ? '★' : '☆');
  }
}
