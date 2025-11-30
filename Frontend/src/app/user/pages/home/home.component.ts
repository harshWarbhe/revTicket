import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  private movieService = inject(MovieService);
  private theaterService = inject(TheaterService);
  private alertService = inject(AlertService);

  movies = signal<Movie[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  selectedGenre = signal('All');
  genres = signal<string[]>(['All']);
  
  stats = signal({
    totalMovies: 0,
    totalTheaters: 0,
    totalCustomers: '1M+'
  });

  filteredMovies = computed(() => {
    const search = this.searchTerm().toLowerCase();
    const genre = this.selectedGenre();
    return this.movies().filter(movie => {
      const matchesSearch = !search || 
                           movie.title.toLowerCase().includes(search) ||
                           (movie.genre && movie.genre.some(g => g.toLowerCase().includes(search))) ||
                           (movie.language && movie.language.toLowerCase().includes(search));
      
      const matchesGenre = genre === 'All' || 
                          (movie.genre && movie.genre.includes(genre));
      
      return matchesSearch && matchesGenre;
    });
  });

  displayMovieCount = computed(() => {
    const count = this.stats().totalMovies;
    return count > 0 ? `${count}+` : '500+';
  });

  displayTheaterCount = computed(() => {
    const count = this.stats().totalTheaters;
    return count > 0 ? `${count}+` : '50+';
  });

  ngOnInit(): void {
    window.scrollTo(0, 0);
    this.loadMovies();
    this.loadStats();
  }

  loadMovies(): void {
    this.loading.set(true);
    this.movieService.getMovies().subscribe({
      next: (movies) => {
        const activeMovies = movies.filter(movie => movie.isActive);
        this.movies.set(activeMovies);
        this.stats.update(s => ({ ...s, totalMovies: activeMovies.length }));
        this.extractGenres();
        this.loading.set(false);
      },
      error: () => {
        this.alertService.error('Failed to load movies. Please try again.');
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.theaterService.getAllTheaters(false).subscribe({
      next: (theaters) => {
        this.stats.update(s => ({ ...s, totalTheaters: theaters.length }));
      },
      error: () => {}
    });
  }

  extractGenres(): void {
    const allGenres = new Set<string>();
    this.movies().forEach(movie => {
      if (movie.genre && Array.isArray(movie.genre)) {
        movie.genre.forEach(genre => allGenres.add(genre));
      }
    });
    this.genres.set(['All', ...Array.from(allGenres).sort()]);
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  onGenreFilter(genre: string): void {
    this.selectedGenre.set(genre);
  }
}
