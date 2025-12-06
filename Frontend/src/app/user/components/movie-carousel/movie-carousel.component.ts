import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-movie-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="movie-grid-section">
      <div class="section-header">
        <h2 class="section-title">{{ title() }}</h2>
      </div>
      <div class="movies-grid">
        @for (movie of movies(); track movie.id) {
        <div class="movie-card" (click)="viewDetails(movie.id)">
          <div class="card-poster">
            <img [src]="movie.posterUrl" [alt]="movie.title">
            @if (movie.rating) {
              <div class="rating-badge">⭐ {{ movie.rating | number:'1.1-1' }}/5</div>
            }
          </div>
          <div class="card-content">
            <h3 class="movie-title">{{ movie.title }}</h3>
            <div class="movie-meta">
              <span class="language">{{ movie.language }}</span>
              <span class="duration">{{ movie.duration }}m</span>
            </div>
            <div class="movie-genres">
              @for (genre of movie.genre.slice(0, 2); track genre) {
                <span class="genre-tag">{{ genre }}</span>
              }
            </div>
            <div class="card-actions">
              <button class="btn-showtimes" (click)="viewShowtimes($event, movie.id)">Showtimes</button>
              <button class="btn-book" (click)="bookNow($event, movie.id)">Book</button>
            </div>
          </div>
        </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .movie-grid-section {
      padding: 48px 0;
      background: #f8f9fa;
    }
    .section-header {
      max-width: 1400px;
      margin: 0 auto 32px;
      padding: 0 32px;
    }
    .section-title {
      font-size: 32px;
      font-weight: 800;
      color: #1a1a1a;
      margin: 0;
    }
    .movies-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 32px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
    }
    .movie-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .movie-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.15);
    }
    .card-poster {
      position: relative;
      width: 100%;
      height: 360px;
      overflow: hidden;
    }
    .card-poster img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .movie-card:hover .card-poster img {
      transform: scale(1.08);
    }
    .rating-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 700;
      backdrop-filter: blur(10px);
    }
    .card-content {
      padding: 16px;
    }
    .movie-title {
      font-size: 17px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 0 0 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 44px;
    }
    .movie-meta {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #666;
      font-weight: 600;
    }
    .movie-genres {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      min-height: 28px;
      flex-wrap: wrap;
    }
    .genre-tag {
      background: #f5f5f5;
      color: #666;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .card-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .btn-showtimes,
    .btn-book {
      padding: 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }
    .btn-showtimes {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }
    .btn-showtimes:hover {
      background: #f8f9ff;
      transform: translateY(-2px);
    }
    .btn-book {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-book:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }
    @media (max-width: 1200px) {
      .movies-grid {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
    }
    @media (max-width: 768px) {
      .section-header,
      .movies-grid {
        padding: 0 16px;
      }
      .section-title {
        font-size: 26px;
      }
      .movies-grid {
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 16px;
      }
      .card-poster {
        height: 240px;
      }
    }
  `]
})
export class MovieCarouselComponent {
  movies = input<Movie[]>([]);
  title = input<string>('Now Showing');

  private router = inject(Router);

  viewDetails(movieId: string): void {
    this.router.navigate(['/user/movie-details', movieId]);
  }

  viewShowtimes(event: Event, movieId: string): void {
    event.stopPropagation();
    this.router.navigate(['/user/showtimes', movieId]);
  }

  bookNow(event: Event, movieId: string): void {
    event.stopPropagation();
    this.router.navigate(['/user/showtimes', movieId]);
  }
}
