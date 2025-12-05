import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MovieService } from '../../../core/services/movie.service';
import { AlertService } from '../../../core/services/alert.service';
import { Movie } from '../../../core/models/movie.model';
import { ReviewService, ReviewResponse } from '../../../core/services/review.service';

@Component({
  selector: 'app-manage-movies',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-movies.component.html',
  styleUrls: ['./manage-movies.component.css']
})
export class ManageMoviesComponent implements OnInit {
  private router = inject(Router);
  private movieService = inject(MovieService);
  private alertService = inject(AlertService);
  private reviewService = inject(ReviewService);

  movies = signal<Movie[]>([]);
  searchTerm = signal('');
  selectedGenre = signal('');
  showInactive = signal(false);
  loading = signal(false);
  deletingId = signal<string | null>(null);
  sortField = signal<string>('');
  sortDir = signal<'asc' | 'desc'>('asc');
  togglingStatusId = signal<string | null>(null);
  selectedMovieReviews = signal<ReviewResponse[]>([]);
  showReviewsModal = signal(false);
  selectedMovieTitle = signal('');
  
  availableGenres = computed(() => {
    const genres = new Set<string>();
    this.movies().forEach(movie => {
      if (movie.genre && Array.isArray(movie.genre)) {
        movie.genre.forEach(g => {
          if (g && g.trim()) genres.add(g.trim());
        });
      }
    });
    return Array.from(genres).sort();
  });

  genreCount = computed(() => {
    const genre = this.selectedGenre();
    if (!genre) return 0;
    return this.movies().filter(m => m.genre?.includes(genre)).length;
  });

  filteredMovies = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const genre = this.selectedGenre();
    const showInactive = this.showInactive();
    const sortField = this.sortField();
    const sortDir = this.sortDir();
    
    let filtered = this.movies().filter(movie => {
      const matchesSearch = !search || 
        movie.title?.toLowerCase().includes(search) ||
        movie.description?.toLowerCase().includes(search) ||
        movie.director?.toLowerCase().includes(search) ||
        movie.language?.toLowerCase().includes(search);
      
      const matchesGenre = !genre || 
        (movie.genre && movie.genre.includes(genre));
      
      const matchesStatus = showInactive || movie.isActive;
      
      return matchesSearch && matchesGenre && matchesStatus;
    });

    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: any = a[sortField as keyof Movie];
        let bVal: any = b[sortField as keyof Movie];

        if (sortField === 'releaseDate') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }

        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  });

  toggleInactiveFilter(): void {
    this.showInactive.set(!this.showInactive());
  }

  getDirector(movie: Movie): string {
    return movie.director || 'N/A';
  }

  formatReleaseDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading.set(true);
    this.movieService.getAdminMovies().subscribe({
      next: (movies) => {
        const sorted = (movies || []).sort((a, b) => b.id.localeCompare(a.id));
        this.movies.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading movies:', err);
        this.alertService.error('Failed to load movies. Please try again.');
        this.movies.set([]);
        this.loading.set(false);
      }
    });
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/movies/default-poster.png';
  }

  editMovie(movie: Movie): void {
    this.router.navigate(['/admin/add-movie'], { 
      queryParams: { id: movie.id } 
    });
  }

  deleteMovie(movie: Movie): void {
    if (confirm(`Are you sure you want to delete "${movie.title}"?\n\nThis action cannot be undone and will remove all associated showtimes.`)) {
      this.deletingId.set(movie.id);
      this.movieService.deleteMovie(movie.id).subscribe({
        next: () => {
          this.alertService.success(`"${movie.title}" deleted successfully!`);
          const updatedMovies = this.movies().filter(m => m.id !== movie.id);
          this.movies.set(updatedMovies);
          this.deletingId.set(null);
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.alertService.error('Failed to delete movie. It may have active showtimes.');
          this.deletingId.set(null);
        }
      });
    }
  }

  sortBy(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  onHeaderKeydown(event: KeyboardEvent, field: string): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.sortBy(field);
    }
  }

  toggleMovieStatus(movie: Movie, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const previousState = movie.isActive;
    const movieIndex = this.movies().findIndex(m => m.id === movie.id);
    
    if (movieIndex === -1) return;

    this.togglingStatusId.set(movie.id);
    
    this.movieService.toggleMovieStatus(movie.id).subscribe({
      next: (updatedMovie) => {
        this.togglingStatusId.set(null);
        const movies = [...this.movies()];
        const idx = movies.findIndex(m => m.id === movie.id);
        if (idx !== -1) {
          movies[idx] = updatedMovie;
          this.movies.set(movies);
        }
        const status = updatedMovie.isActive ? 'activated' : 'deactivated';
        this.alertService.success(`"${movie.title}" ${status} successfully!`);
      },
      error: (err) => {
        console.error('Toggle status error:', err);
        this.togglingStatusId.set(null);
        this.alertService.error('Failed to update movie status. Please try again.');
      }
    });
  }

  onStatusKeydown(event: KeyboardEvent, movie: Movie): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleMovieStatus(movie);
    }
  }

  trackById(index: number, item: any): string {
    return item?.id || index.toString();
  }

  viewReviews(movie: Movie): void {
    this.selectedMovieTitle.set(movie.title);
    this.showReviewsModal.set(true);
    this.reviewService.getAllMovieReviews(movie.id).subscribe({
      next: (reviews) => this.selectedMovieReviews.set(reviews),
      error: () => this.alertService.error('Failed to load reviews')
    });
  }

  closeReviewsModal(): void {
    this.showReviewsModal.set(false);
    this.selectedMovieReviews.set([]);
  }

  approveReview(reviewId: string): void {
    this.reviewService.approveReview(reviewId).subscribe({
      next: () => {
        this.selectedMovieReviews.update(reviews => 
          reviews.map(r => r.id === reviewId ? { ...r, approved: true } : r)
        );
        this.alertService.success('Review approved');
      },
      error: () => this.alertService.error('Failed to approve review')
    });
  }

  deleteReview(reviewId: string): void {
    if (confirm('Delete this review?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.selectedMovieReviews.update(reviews => 
            reviews.filter(r => r.id !== reviewId)
          );
          this.alertService.success('Review deleted');
        },
        error: () => this.alertService.error('Failed to delete review')
      });
    }
  }

  getStars(rating: number): string[] {
    return Array(5).fill('★').map((star, i) => i < rating ? '★' : '☆');
  }
}
