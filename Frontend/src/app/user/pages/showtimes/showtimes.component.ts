import { Component, OnInit, signal, computed, inject, effect } from '@angular/core';
import { DisplayUtils } from '../../../core/utils/display-utils';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MovieService } from '../../../core/services/movie.service';
import { ShowtimeService, Showtime } from '../../../core/services/showtime.service';
import { AlertService } from '../../../core/services/alert.service';
import { LocationService } from '../../../core/services/location.service';
import { Movie } from '../../../core/models/movie.model';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../../core/services/settings.service';
import { LocationSelectorComponent } from '../../../shared/components/location-selector/location-selector.component';

interface TheaterGroup {
  theaterId: string;
  theaterName: string;
  location: string;
  showtimes: Showtime[];
}

@Component({
  selector: 'app-showtimes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './showtimes.component.html',
  styleUrls: ['./showtimes.component.css']
})
export class ShowtimesComponent implements OnInit {
  movie = signal<Movie | null>(null);
  showtimes = signal<Showtime[]>([]);
  selectedDate = signal(new Date());
  loading = signal(true);
  error = signal('');
  screenNames = signal<Map<string, string>>(new Map());
  
  selectedLanguage = signal('All');
  selectedFormat = signal('All');
  priceRange = signal('All');
  sortBy = signal<string>('time');
  searchTerm = signal('');

  dates = computed(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  });

  getShowtimeCountForDate(date: Date): number {
    const dateStr = this.formatDate(date);
    return this.showtimes().filter(s => {
      const showDate = new Date(s.showDateTime);
      const showDateStr = `${showDate.getFullYear()}-${String(showDate.getMonth() + 1).padStart(2, '0')}-${String(showDate.getDate()).padStart(2, '0')}`;
      return showDateStr === dateStr;
    }).length;
  }

  languages = computed(() => {
    const langs = new Set<string>();
    this.showtimes().forEach(s => langs.add(s.movie?.language || 'Unknown'));
    return ['All', ...Array.from(langs)];
  });



  theaterGroups = computed(() => {
    let filtered = this.showtimes();

    // Filter by selected date
    const selectedDateStr = this.formatDate(this.selectedDate());
    filtered = filtered.filter(s => {
      const showDate = new Date(s.showDateTime);
      const showDateStr = `${showDate.getFullYear()}-${String(showDate.getMonth() + 1).padStart(2, '0')}-${String(showDate.getDate()).padStart(2, '0')}`;
      return showDateStr === selectedDateStr;
    });

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

    let result = Array.from(groups.values());

    // Search filter
    if (this.searchTerm().trim()) {
      const term = this.searchTerm().toLowerCase();
      result = result.filter(theater => 
        theater.theaterName.toLowerCase().includes(term) ||
        theater.location.toLowerCase().includes(term)
      );
    }

    // Sort
    const sortBy = this.sortBy();
    if (sortBy === 'name') {
      result.sort((a, b) => a.theaterName.localeCompare(b.theaterName));
    } else if (sortBy === 'price') {
      result.sort((a, b) => {
        const avgPriceA = a.showtimes.reduce((sum, s) => sum + s.ticketPrice, 0) / a.showtimes.length;
        const avgPriceB = b.showtimes.reduce((sum, s) => sum + s.ticketPrice, 0) / b.showtimes.length;
        return avgPriceA - avgPriceB;
      });
    }

    return result.map(group => ({
      ...group,
      showtimes: group.showtimes.sort((a, b) => 
        new Date(a.showDateTime).getTime() - new Date(b.showDateTime).getTime()
      )
    }));
  });

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);
  private showtimeService = inject(ShowtimeService);
  private alertService = inject(AlertService);
  readonly settingsService = inject(SettingsService);
  readonly locationService = inject(LocationService);

  constructor() {
    effect(() => {
      const city = this.locationService.selectedCity();
      const movie = this.movie();
      if (movie) {
        this.loading.set(true);
        this.loadShowtimes(movie.id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id) {
      this.loadDataById(id);
    } else {
      this.alertService.error('Invalid movie');
      this.router.navigate(['/user/home']);
    }
  }

  selectDate(date: Date): void {
    this.selectedDate.set(date);
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

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  selectShowtime(showtimeId: string): void {
    this.router.navigate(['/user/seat-booking', showtimeId]);
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDayLabel(date: Date): string {
    if (this.isToday(date)) return 'Today';
    if (this.isTomorrow(date)) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }



  getScreenLabel(screenId: string): string {
    return this.screenNames().get(screenId) || 'Screen 1';
  }

  private loadDataById(id: string): void {
    this.loading.set(true);
    
    this.movieService.getMovieById(id).subscribe({
      next: (movie: Movie) => {
        this.movie.set(movie);
        this.loadShowtimes(movie.id);
      },
      error: () => {
        this.error.set('Movie not found');
        this.loading.set(false);
        this.alertService.error('Movie not found');
        this.router.navigate(['/user/home']);
      }
    });
  }

  private loadShowtimes(movieId: string): void {
    const city = this.locationService.selectedCity() || undefined;
    this.showtimeService.getShowtimesByMovie(movieId, undefined, city).subscribe({
      next: (data) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(today.getDate() + 7);
        sevenDaysLater.setHours(23, 59, 59, 999);
        
        const active = data.filter(s => {
          const showDate = new Date(s.showDateTime);
          return s.status === 'ACTIVE' && showDate >= today && showDate <= sevenDaysLater;
        });
        
        this.showtimes.set(active);
        this.loadScreenNames(active);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load showtimes');
        this.loading.set(false);
        this.alertService.error('Unable to fetch showtimes');
      }
    });
  }

  private loadScreenNames(showtimes: Showtime[]): void {
    const screenIds = [...new Set(showtimes.map(s => s.screen))];
    const names = new Map<string, string>();
    
    screenIds.forEach((screenId, index) => {
      names.set(screenId, `Screen ${index + 1}`);
    });
    
    this.screenNames.set(names);
  }
}
