import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subject } from 'rxjs';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ShowtimeService, Showtime, Screen } from '../../../core/services/showtime.service';
import { MovieService } from '../../../core/services/movie.service';
import { TheaterService, Theater } from '../../../core/services/theater.service';
import { AlertService } from '../../../core/services/alert.service';
import { Movie } from '../../../core/models/movie.model';

interface SeatSection {
  name: string;
  rowStart: string;
  rowEnd: string;
  seatsPerRow: number;
  price: number;
  type: 'REGULAR' | 'PREMIUM' | 'VIP';
}

interface ShowtimeForm {
  movieId: string;
  theaterId: string;
  screen: string;
  screenId: string;
  showDateTime: string;
  ticketPrice: number | null;
  totalSeats: number | null;
  status: Showtime['status'];
  seatLayout: SeatSection[];
  useCustomLayout: boolean;
  language: string;
  format: string;
}

@Component({
  selector: 'app-manage-shows',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-shows.component.html',
  styleUrls: ['./manage-shows.component.css']
})
export class ManageShowsComponent implements OnInit {
  shows = signal<Showtime[]>([]);
  movies = signal<Movie[]>([]);
  theaters = signal<Theater[]>([]);
  screens = signal<Screen[]>([]);
  availableScreens = computed(() => {
    const theaterId = this.newShow.theaterId;
    if (!theaterId) return [];
    return this.screens().filter(s => s.theaterId === theaterId);
  });

  searchTerm = signal('');
  selectedMovieId = signal('');
  selectedTheaterId = signal('');
  selectedDate = signal('');
  showAddForm = signal(false);
  isEditMode = signal(false);
  editingShowId = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);
  deleteInProgressId = signal<string | null>(null);
  toggleStatusInProgressId = signal<string | null>(null);
  
  private searchSubject = new Subject<string>();
  private destroyRef = inject(DestroyRef);
  private showtimeService = inject(ShowtimeService);
  private movieService = inject(MovieService);
  private theaterService = inject(TheaterService);
  private alertService = inject(AlertService);
  
  filteredShows = computed(() => this.shows());
  newShow: ShowtimeForm = this.getEmptyForm();

  ngOnInit(): void {
    this.loadData();
    this.setupSearchDebounce();
  }
  
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.reloadShowtimes();
    });
  }
  
  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }
  
  onFilterChange(): void {
    this.reloadShowtimes();
  }
  
  private getEmptyForm(): ShowtimeForm {
    return {
      movieId: '',
      theaterId: '',
      screen: '',
      screenId: '',
      showDateTime: '',
      ticketPrice: null,
      totalSeats: null,
      status: 'ACTIVE',
      seatLayout: [],
      useCustomLayout: false,
      language: 'English',
      format: '2D'
    };
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      movies: this.movieService.getAdminMovies(),
      theaters: this.theaterService.getAdminTheaters(false),
      showtimes: this.showtimeService.getAdminShowtimes()
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ movies, theaters, showtimes }) => {
          this.movies.set(movies || []);
          this.theaters.set(theaters || []);
          this.shows.set((showtimes || []).map((s: Showtime) => this.mapShowtimeToView(s)));
        },
        error: (err: any) => {
          console.error('Load data error:', err);
          this.alertService.error('Failed to load movies, theaters, or showtimes.');
          this.movies.set([]);
          this.theaters.set([]);
          this.shows.set([]);
        }
      });
  }

  private reloadShowtimes(): void {
    this.loading.set(true);
    const filters: any = {};
    
    if (this.selectedMovieId()) filters.movieId = this.selectedMovieId();
    if (this.selectedTheaterId()) filters.theaterId = this.selectedTheaterId();
    if (this.selectedDate()) filters.date = this.selectedDate();
    if (this.searchTerm()) filters.search = this.searchTerm();
    
    this.showtimeService.getAdminShowtimes(filters)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (showtimes: Showtime[]) => {
          this.shows.set((showtimes || []).map((s: Showtime) => this.mapShowtimeToView(s)));
        },
        error: (err: any) => {
          console.error('Reload showtimes error:', err);
          this.alertService.error('Unable to refresh showtimes.');
        }
      });
  }

  addNewShow(): void {
    this.isEditMode.set(false);
    this.editingShowId.set(null);
    this.showAddForm.set(true);
    this.resetForm();
  }

  resetForm(): void {
    this.newShow = this.getEmptyForm();
  }

  addSeatSection(): void {
    this.newShow.seatLayout.push({
      name: '',
      rowStart: 'A',
      rowEnd: 'A',
      seatsPerRow: 12,
      price: 150,
      type: 'REGULAR'
    });
  }

  removeSeatSection(index: number): void {
    this.newShow.seatLayout.splice(index, 1);
  }

  calculateTotalSeats(): number {
    if (!this.newShow.useCustomLayout) {
      return this.newShow.totalSeats || 0;
    }
    return this.newShow.seatLayout.reduce((total, section) => {
      const rows = section.rowEnd.charCodeAt(0) - section.rowStart.charCodeAt(0) + 1;
      return total + (rows * section.seatsPerRow);
    }, 0);
  }

  saveShow(): void {
    if (!this.validateForm()) {
      return;
    }

    const totalSeats = this.newShow.useCustomLayout ? this.calculateTotalSeats() : Number(this.newShow.totalSeats);

    const payload: any = {
      movieId: this.newShow.movieId,
      theaterId: this.newShow.theaterId,
      screen: this.newShow.screen.trim(),
      showDateTime: new Date(this.newShow.showDateTime).toISOString(),
      ticketPrice: Number(this.newShow.ticketPrice),
      totalSeats: totalSeats,
      status: this.newShow.status
    };

    if (this.newShow.useCustomLayout && this.newShow.seatLayout.length > 0) {
      payload.seatLayout = this.newShow.seatLayout;
    }

    if (!this.isEditMode()) {
      payload.availableSeats = payload.totalSeats;
    }

    this.submitting.set(true);

    const editId = this.editingShowId();
    const request$ = this.isEditMode() && editId
      ? this.showtimeService.updateShowtime(editId, payload)
      : this.showtimeService.createShowtime(payload);

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success(`Show ${this.isEditMode() ? 'updated' : 'created'} successfully!`);
          this.cancelAdd();
          this.reloadShowtimes();
        },
        error: () => {
          this.alertService.error('Unable to save show. Please try again.');
        }
      });
  }

  validateForm(): boolean {
    if (!this.newShow.movieId) {
      this.alertService.error('Please select a movie.');
      return false;
    }

    if (!this.newShow.theaterId) {
      this.alertService.error('Please select a theater.');
      return false;
    }

    if (!this.newShow.screenId || !this.newShow.screen.trim()) {
      this.alertService.error('Please select a screen.');
      return false;
    }

    if (!this.newShow.showDateTime) {
      this.alertService.error('Please select a show date and time.');
      return false;
    }

    if (!this.newShow.language) {
      this.alertService.error('Please select a language.');
      return false;
    }

    if (!this.newShow.format) {
      this.alertService.error('Please select a format.');
      return false;
    }

    const ticketPrice = Number(this.newShow.ticketPrice);
    const totalSeats = this.newShow.useCustomLayout ? this.calculateTotalSeats() : Number(this.newShow.totalSeats);

    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      this.alertService.error('Ticket price must be greater than 0.');
      return false;
    }

    if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
      this.alertService.error('Total seats must be a positive number.');
      return false;
    }

    return true;
  }

  cancelAdd(): void {
    this.showAddForm.set(false);
    this.isEditMode.set(false);
    this.editingShowId.set(null);
    this.resetForm();
  }

  editShow(show: Showtime): void {
    this.isEditMode.set(true);
    this.editingShowId.set(show.id);
    this.showAddForm.set(true);

    this.newShow = {
      movieId: show.movieId,
      theaterId: show.theaterId,
      screen: show.screen,
      screenId: '',
      showDateTime: this.toLocalDateTimeInput(show.showDateTime),
      ticketPrice: show.ticketPrice,
      totalSeats: show.totalSeats,
      status: show.status,
      seatLayout: [],
      useCustomLayout: false,
      language: (show.movie?.language || 'English'),
      format: '2D'
    };

    this.loadTheaterScreens(show.theaterId);
  }

  viewBookings(show: Showtime): void {
    this.alertService.info(`View bookings for: ${show.movie?.title ?? 'this show'}`);
  }

  deleteShow(show: Showtime): void {
    const movieTitle = show.movie?.title || 'Unknown Movie';
    const theaterName = show.theater?.name || 'Unknown Theater';
    
    if (!confirm(`Are you sure you want to delete the show "${movieTitle}" at ${theaterName}?`)) {
      return;
    }

    this.deleteInProgressId.set(show.id);
    this.showtimeService.deleteShowtime(show.id)
      .pipe(
        finalize(() => this.deleteInProgressId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success('Show deleted successfully!');
          this.reloadShowtimes();
        },
        error: () => {
          this.alertService.error('Failed to delete show.');
        }
      });
  }
  
  toggleShowStatus(show: Showtime): void {
    this.toggleStatusInProgressId.set(show.id);
    this.showtimeService.toggleShowtimeStatus(show.id)
      .pipe(
        finalize(() => this.toggleStatusInProgressId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updated) => {
          this.alertService.success(`Show status changed to ${updated.status}`);
          this.reloadShowtimes();
        },
        error: () => {
          this.alertService.error('Failed to update show status.');
        }
      });
  }

  hasFilters(): boolean {
    return !!(this.searchTerm() || this.selectedMovieId() || this.selectedTheaterId() || this.selectedDate());
  }

  getEmptyStateMessage(): string {
    if (this.hasFilters()) {
      return 'No shows match your current filters. Try adjusting your search criteria.';
    }
    return 'No shows scheduled yet. Start by adding your first show.';
  }

  trackByShowId(_index: number, show: Showtime): string {
    return show.id;
  }

  private mapShowtimeToView(showtime: Showtime): Showtime {
    const movie = showtime.movie ?? this.toMovieSummary(showtime.movieId);
    const theater = showtime.theater ?? this.toTheaterSummary(showtime.theaterId);
    return {
      ...showtime,
      movie,
      theater
    };
  }

  private toMovieSummary(movieId: string): Showtime['movie'] {
    const movie = this.movies().find(m => m.id === movieId);
    return movie
      ? {
          id: movie.id,
          title: movie.title,
          genre: movie.genre,
          duration: movie.duration,
          rating: movie.rating,
          posterUrl: movie.posterUrl,
          language: movie.language
        }
      : {
          id: movieId,
          title: 'Unknown',
          genre: [],
          duration: 0,
          rating: 0,
          posterUrl: 'assets/images/movies/default-poster.png',
          language: 'English'
        };
  }

  private toTheaterSummary(theaterId: string): Showtime['theater'] {
    const theater = this.theaters().find(t => t.id === theaterId);
    return theater
      ? { id: theater.id, name: theater.name, location: theater.location }
      : { id: theaterId, name: 'Unknown', location: '' };
  }

  private toLocalDateTimeInput(dateTime: string): string {
    const date = new Date(dateTime);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/images/movies/default-poster.png';
  }

  onTheaterChange(): void {
    this.newShow.screenId = '';
    this.newShow.screen = '';
    if (this.newShow.theaterId) {
      this.loadTheaterScreens(this.newShow.theaterId);
    } else {
      this.screens.set([]);
    }
  }

  onScreenChange(): void {
    const screen = this.screens().find(s => s.id === this.newShow.screenId);
    if (screen) {
      this.newShow.screen = screen.name;
      if (!this.newShow.useCustomLayout && !this.newShow.totalSeats) {
        this.newShow.totalSeats = screen.totalSeats;
      }
    }
  }

  private loadTheaterScreens(theaterId: string): void {
    this.theaterService.getTheaterScreens(theaterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (screens: Screen[]) => {
          this.screens.set(screens || []);
        },
        error: (err: any) => {
          console.error('Failed to load screens:', err);
          this.screens.set([]);
        }
      });
  }

  trackById(index: number, item: any): string {
    return item?.id || index.toString();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
