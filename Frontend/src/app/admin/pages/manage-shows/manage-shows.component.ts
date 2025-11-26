import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ShowtimeService, Showtime } from '../../../core/services/showtime.service';
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
  showDateTime: string;
  ticketPrice: number | null;
  totalSeats: number | null;
  status: Showtime['status'];
  seatLayout: SeatSection[];
  useCustomLayout: boolean;
}

@Component({
  selector: 'app-manage-shows',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './manage-shows.component.html',
  styleUrls: ['./manage-shows.component.css']
})
export class ManageShowsComponent implements OnInit {
  shows: Showtime[] = [];
  filteredShows: Showtime[] = [];
  movies: Movie[] = [];
  theaters: Theater[] = [];

  searchTerm = '';
  selectedMovieId = '';
  selectedTheaterId = '';
  selectedDate = '';
  showAddForm = false;
  isEditMode = false;
  editingShowId: string | null = null;
  loading = false;
  submitting = false;
  deleteInProgressId: string | null = null;

  newShow: ShowtimeForm = {
    movieId: '',
    theaterId: '',
    screen: '',
    showDateTime: '',
    ticketPrice: null,
    totalSeats: null,
    status: 'ACTIVE',
    seatLayout: [],
    useCustomLayout: false
  };

  constructor(
    private showtimeService: ShowtimeService,
    private movieService: MovieService,
    private theaterService: TheaterService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      movies: this.movieService.getMovies(),
      theaters: this.theaterService.getAllTheaters(false),
      showtimes: this.showtimeService.getShowtimes()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ movies, theaters, showtimes }) => {
          this.movies = movies;
          this.theaters = theaters;
          this.shows = showtimes.map(s => this.mapShowtimeToView(s));
          this.filterShows();
        },
        error: (err) => {
          console.error('Failed to load admin data', err);
          this.alertService.error('Failed to load movies, theaters, or showtimes.');
        }
      });
  }

  private reloadShowtimes(): void {
    this.showtimeService.getShowtimes().subscribe({
      next: (showtimes) => {
        this.shows = showtimes.map(s => this.mapShowtimeToView(s));
        this.filterShows();
      },
      error: (err) => {
        console.error('Failed to refresh showtimes', err);
        this.alertService.error('Unable to refresh showtimes.');
      }
    });
  }

  onSearch(): void {
    this.filterShows();
  }

  onFilterChange(): void {
    this.filterShows();
  }

  filterShows(): void {
    const search = this.searchTerm.toLowerCase();
    this.filteredShows = this.shows.filter(show => {
      const movieTitle = show.movie?.title?.toLowerCase() || '';
      const theaterName = show.theater?.name?.toLowerCase() || '';
      const matchesSearch = !search || movieTitle.includes(search) || theaterName.includes(search);

      const matchesMovie = !this.selectedMovieId || show.movieId === this.selectedMovieId;
      const matchesTheater = !this.selectedTheaterId || show.theaterId === this.selectedTheaterId;

      let matchesDate = true;
      if (this.selectedDate) {
        const showDate = new Date(show.showDateTime).toDateString();
        const filterDate = new Date(this.selectedDate).toDateString();
        matchesDate = showDate === filterDate;
      }

      return matchesSearch && matchesMovie && matchesTheater && matchesDate;
    });
  }



  addNewShow(): void {
    this.isEditMode = false;
    this.editingShowId = null;
    this.showAddForm = true;
    this.resetForm();
  }

  resetForm(): void {
    this.newShow = {
      movieId: '',
      theaterId: '',
      screen: '',
      showDateTime: '',
      ticketPrice: null,
      totalSeats: null,
      status: 'ACTIVE',
      seatLayout: [],
      useCustomLayout: false
    };
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

    if (!this.isEditMode) {
      payload.availableSeats = payload.totalSeats;
    }

    this.submitting = true;

    const request$ = this.isEditMode && this.editingShowId
      ? this.showtimeService.updateShowtime(this.editingShowId, payload)
      : this.showtimeService.createShowtime(payload);

    request$
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.alertService.success(`Show ${this.isEditMode ? 'updated' : 'created'} successfully!`);
          this.cancelAdd();
          this.reloadShowtimes();
        },
        error: (err) => {
          console.error('Failed to save show', err);
          this.alertService.error('Unable to save show. Please try again.');
        }
      });
  }

  validateForm(): boolean {
    if (!this.newShow.movieId || !this.newShow.theaterId || !this.newShow.screen.trim()) {
      this.alertService.error('Movie, theater, and screen are required.');
      return false;
    }

    if (!this.newShow.showDateTime) {
      this.alertService.error('Please select a show date and time.');
      return false;
    }

    const ticketPrice = Number(this.newShow.ticketPrice);
    const totalSeats = Number(this.newShow.totalSeats);

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
    this.showAddForm = false;
    this.isEditMode = false;
    this.editingShowId = null;
    this.resetForm();
  }

  editShow(show: Showtime): void {
    this.isEditMode = true;
    this.editingShowId = show.id;
    this.showAddForm = true;

    this.newShow = {
      movieId: show.movieId,
      theaterId: show.theaterId,
      screen: show.screen,
      showDateTime: this.toLocalDateTimeInput(show.showDateTime),
      ticketPrice: show.ticketPrice,
      totalSeats: show.totalSeats,
      status: show.status,
      seatLayout: [],
      useCustomLayout: false
    };
  }

  viewBookings(show: Showtime): void {
    this.alertService.info(`View bookings for: ${show.movie?.title ?? 'this show'}`);
  }

  deleteShow(show: Showtime): void {
    if (!confirm(`Delete show "${show.movie?.title || ''}" at ${show.theater?.name || ''}?`)) {
      return;
    }

    this.deleteInProgressId = show.id;
    this.showtimeService.deleteShowtime(show.id)
      .pipe(finalize(() => this.deleteInProgressId = null))
      .subscribe({
        next: () => {
          this.alertService.success('Show deleted successfully!');
          this.reloadShowtimes();
        },
        error: (err) => {
          console.error('Error deleting show:', err);
          this.alertService.error('Failed to delete show.');
        }
      });
  }

  hasFilters(): boolean {
    return !!(this.searchTerm || this.selectedMovieId || this.selectedTheaterId || this.selectedDate);
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
    const movie = this.movies.find(m => m.id === movieId);
    return movie
      ? {
          id: movie.id,
          title: movie.title,
          genre: movie.genre,
          duration: movie.duration,
          rating: movie.rating,
          posterUrl: movie.posterUrl
        }
      : {
          id: movieId,
          title: 'Unknown',
          genre: [],
          duration: 0,
          rating: 0,
          posterUrl: 'assets/images/movies/default-poster.png'
        };
  }

  private toTheaterSummary(theaterId: string): Showtime['theater'] {
    const theater = this.theaters.find(t => t.id === theaterId);
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
}
