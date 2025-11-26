import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from '../../../core/services/movie.service';
import { TheaterService } from '../../../core/services/theater.service';
import { Movie } from '../../../core/models/movie.model';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { MovieCardComponent } from '../../../shared/components/movie-card/movie-card.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCardComponent, LoaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  loading = true;
  searchTerm = '';
  selectedGenre = 'All';
  genres: string[] = ['All'];
  
  // Dynamic stats
  stats = {
    totalMovies: 0,
    totalTheaters: 0,
    totalCustomers: '1M+'
  };

  constructor(
    private movieService: MovieService,
    private theaterService: TheaterService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadMovies();
    this.loadStats();
  }

  loadMovies(): void {
    this.loading = true;
    this.movieService.getMovies().subscribe({
      next: (movies) => {
        this.movies = movies.filter(movie => movie.isActive);
        this.filteredMovies = this.movies;
        this.stats.totalMovies = this.movies.length;
        this.extractGenres();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading movies:', error);
        this.alertService.error('Failed to load movies. Please try again.');
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.theaterService.getAllTheaters(false).subscribe({
      next: (theaters) => {
        this.stats.totalTheaters = theaters.length;
      },
      error: (error) => {
        console.error('Error loading theaters:', error);
      }
    });
  }

  extractGenres(): void {
    const allGenres = new Set<string>();
    this.movies.forEach(movie => {
      if (movie.genre && Array.isArray(movie.genre)) {
        movie.genre.forEach(genre => allGenres.add(genre));
      }
    });
    this.genres = ['All', ...Array.from(allGenres).sort()];
  }

  onSearch(): void {
    this.filterMovies();
  }

  onGenreFilter(genre: string): void {
    this.selectedGenre = genre;
    this.filterMovies();
  }

  private filterMovies(): void {
    this.filteredMovies = this.movies.filter(movie => {
      const searchLower = this.searchTerm.toLowerCase();
      const matchesSearch = !this.searchTerm || 
                           movie.title.toLowerCase().includes(searchLower) ||
                           (movie.genre && movie.genre.some(g => g.toLowerCase().includes(searchLower))) ||
                           (movie.language && movie.language.toLowerCase().includes(searchLower));
      
      const matchesGenre = this.selectedGenre === 'All' || 
                          (movie.genre && movie.genre.includes(this.selectedGenre));
      
      return matchesSearch && matchesGenre;
    });
  }

  get displayMovieCount(): string {
    return this.stats.totalMovies > 0 ? `${this.stats.totalMovies}+` : '500+';
  }

  get displayTheaterCount(): string {
    return this.stats.totalTheaters > 0 ? `${this.stats.totalTheaters}+` : '50+';
  }
}
