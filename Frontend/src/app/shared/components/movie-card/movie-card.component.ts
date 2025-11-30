import { Component, Input, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Movie } from '../../../core/models/movie.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './movie-card.component.html',
  styleUrls: ['./movie-card.component.css']
})
export class MovieCardComponent {
  @Input() movie!: Movie;
  private router = inject(Router);

  onImageError(event: any): void {
    event.target.src = 'assets/images/movies/default-poster.png';
  }

  viewDetails(): void {
    const slug = this.createSlug(this.movie.title);
    this.router.navigate(['/user/movies', slug, this.movie.id]);
  }

  bookNow(): void {
    const slug = this.createSlug(this.movie.title);
    this.router.navigate(['/user/movies', slug, this.movie.id]);
  }

  viewShowtimes(): void {
    const slug = this.createSlug(this.movie.title);
    this.router.navigate(['/user/movies', slug, this.movie.id, 'showtimes']);
  }

  private createSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}