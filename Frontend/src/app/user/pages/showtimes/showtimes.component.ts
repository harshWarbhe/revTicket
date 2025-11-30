import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DisplayUtils } from '../../../core/utils/display-utils';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../../../core/services/movie.service';
import { ShowtimeService, Showtime } from '../../../core/services/showtime.service';
import { AlertService } from '../../../core/services/alert.service';
import { Movie } from '../../../core/models/movie.model';

interface TheaterGroup {
  theaterId: string;
  theaterName: string;
  location: string;
  showtimes: Showtime[];
}

@Component({
  selector: 'app-showtimes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './showtimes.component.html',
  styleUrls: ['./showtimes.component.css']
})
export class ShowtimesComponent implements OnInit {
  movie = signal<Movie | null>(null);
  showtimes = signal<Showtime[]>([]);
  selectedDate = signal(new Date());
  loading = signal(true);
  error = signal('');
  
  selectedLanguage = signal<string>('All');
  selectedFormat = signal<string>('All');
  priceRange = signal<string>('All');
  sortBy = signal<string>('time');

  dates = computed(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  });

  languages = computed(() => {
    const langs = new Set<string>();
    this.showtimes().forEach(s => langs.add(s.movie?.language || 'Unknown'));
    return ['All', ...Array.from(langs)];
  });

  formats = signal(['All', '2D', '3D', 'IMAX']);

  theaterGroups = computed(() => {
    let filtered = this.showtimes();

    if (this.selectedLanguage() !== 'All') {
      filtered = filtered.filter(s => s.movie?.language === this.selectedLanguage());
    }

    if (this.priceRange() !== 'All') {
      const [min, max] = this.priceRange().split('-').map(Number);
      filtered = filtered.filter(s => s.ticketPrice >= min && s.ticketPrice <= max);
    }

    const groups = new Map<string, TheaterGroup>();
    filtered.forEach(show => {
      if (!show.theater) return;
      const key = show.theater.id;
      if (!groups.has(key)) {
        groups.set(key, {
          theaterId: key,
          theaterName: show.theater.name,
          location: show.theater.location || '',
          showtimes: []
        });
      }
      groups.get(key)!.showtimes.push(show);
    });

    return Array.from(groups.values()).map(group => ({
      ...group,
      showtimes: group.showtimes.sort((a, b) => 
        new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime()
      )
    }));
  });

  router = inject(Router);

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieService,
    private showtimeService: ShowtimeService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const slug = this.route.snapshot.paramMap.get('slug');
    
    if (!slug) {
      this.alertService.error('Invalid movie');
      this.router.navigate(['/user/home']);
      return;
    }

    this.loadDataBySlug(slug);
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
    const movie = this.movie();
    if (movie) {
      this.loadShowtimes(movie.id);
    }
  }

  selectLanguage(lang: string): void {
    this.selectedLanguage.set(lang);
  }

  selectFormat(format: string): void {
    this.selectedFormat.set(format);
  }

  selectPriceRange(range: string): void {
    this.priceRange.set(range);
  }

  selectShowtime(showtimeId: string): void {
    const movie = this.movie();
    if (!movie) return;
    
    // Find the showtime to get theater info
    const showtime = this.showtimes().find(s => s.id === showtimeId);
    if (!showtime) return;
    
    const movieSlug = this.createSlug(movie.title);
    const showtimeSlug = this.createShowtimeSlug(showtime);
    
    this.router.navigate(['/user/seat-booking', movieSlug, showtimeSlug]);
  }

  getAvailabilityStatus(availableSeats: number, totalSeats: number): string {
    const percentage = (availableSeats / totalSeats) * 100;
    if (percentage === 0) return 'sold-out';
    if (percentage < 20) return 'fast-filling';
    return 'available';
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private loadDataBySlug(slug: string): void {
    this.loading.set(true);
    
    this.movieService.getMovies().subscribe({
      next: (movies: Movie[]) => {
        const movie = movies.find((m: Movie) => this.createSlug(m.title) === slug);
        if (movie) {
          this.movie.set(movie);
          this.loadShowtimes(movie.id);
        } else {
          this.error.set('Movie not found');
          this.loading.set(false);
          this.alertService.error('Movie not found');
          this.router.navigate(['/user/home']);
        }
      },
      error: () => {
        this.error.set('Failed to load movie details');
        this.loading.set(false);
        this.alertService.error('Movie not found');
        this.router.navigate(['/user/home']);
      }
    });
  }

  private createSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  private createShowtimeSlug(showtime: Showtime): string {
    const theaterSlug = showtime.theater?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'theater';
    const time = new Date(showtime.showDateTime).toTimeString().slice(0, 5).replace(':', '');
    const date = new Date(showtime.showDateTime).toISOString().slice(0, 10);
    return `${theaterSlug}-${date}-${time}-${showtime.id}`;
  }
  
  getScreenLabel(showtimeId: string): string {
    const showtime = this.showtimes().find(s => s.id === showtimeId);
    return showtime?.screen || 'Screen 1';
  }

  private loadShowtimes(movieId: string): void {
    const dateStr = this.formatDate(this.selectedDate());
    
    this.showtimeService.getShowtimesByMovie(movieId, dateStr).subscribe({
      next: (data) => {
        const active = data.filter(s => s.status === 'ACTIVE');
        this.showtimes.set(active);
        this.error.set(active.length === 0 ? 'No showtimes available for this date' : '');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load showtimes');
        this.loading.set(false);
        this.alertService.error('Unable to fetch showtimes');
      }
    });
  }
}
