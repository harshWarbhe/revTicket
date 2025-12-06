import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MovieService } from '../../../core/services/movie.service';
import { ShowtimeService, Showtime } from '../../../core/services/showtime.service';
import { LocationService } from '../../../core/services/location.service';
import { Movie } from '../../../core/models/movie.model';
import { DisplayUtils } from '../../../core/utils/display-utils';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieReviewsComponent } from '../../components/movie-reviews/movie-reviews.component';

@Component({
  selector: 'app-movie-details',
  standalone: true,
  imports: [CommonModule, RouterModule, MovieReviewsComponent],
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.css']
})
export class MovieDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieService = inject(MovieService);
  private showtimeService = inject(ShowtimeService);
  private locationService = inject(LocationService);
  private sanitizer = inject(DomSanitizer);
  
  movie = signal<Movie | null>(null);
  showtimes = signal<Showtime[]>([]);
  loading = signal(true);
  activeTab = signal('overview');
  showTrailer = signal(false);

  getSlug(): string {
    const title = this.movie()?.title || '';
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');;
  }

  getSafeTrailerUrl(): SafeResourceUrl | null {
    const url = this.movie()?.trailerUrl;
    if (!url) return null;
    
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    
    return videoId ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`) : null;
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.loadMovie(id);
    } else {
      this.router.navigate(['/user/home']);
    }
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  toggleTrailer(): void {
    this.showTrailer.set(!this.showTrailer());
  }

  bookTickets(): void {
    const movie = this.movie();
    if (movie) {
      this.router.navigate(['/user/showtimes', movie.id]);
    }
  }

  onImageError(event: any): void {
    event.target.src = 'https://via.placeholder.com/300x450/667eea/ffffff?text=No+Poster';
  }

  private loadMovie(movieId: string): void {
    this.movieService.getMovieById(movieId).subscribe({
      next: (movie) => {
        this.movie.set(movie);
        this.loadShowtimes(movie.id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/user/home']);
      }
    });
  }

  private loadMovieBySlug(slug: string): void {
    // First get all movies and find by slug
    this.movieService.getMovies().subscribe({
      next: (movies: Movie[]) => {
        const movie = movies.find((m: Movie) => this.createSlug(m.title) === slug);
        if (movie) {
          this.movie.set(movie);
          this.loadShowtimes(movie.id);
        } else {
          this.router.navigate(['/user/home']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/user/home']);
      }
    });
  }

  private createSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private loadShowtimes(movieId: string): void {
    const today = new Date().toISOString().split('T')[0];
    const city = this.locationService.selectedCity();
    this.showtimeService.getShowtimesByMovie(movieId, today, city || undefined).subscribe({
      next: (data) => {
        this.showtimes.set(data.filter(s => s.status === 'ACTIVE').slice(0, 5));
      },
      error: () => {}
    });
  }
  
  getScreenLabel(screen: string): string {
    // If screen is a UUID, convert to readable format
    if (screen && screen.length === 36) {
      return DisplayUtils.getScreenLabel(screen);
    }
    return screen || 'Screen 1';
  }
}
