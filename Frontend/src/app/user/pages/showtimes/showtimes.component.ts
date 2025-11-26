import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from '../../../core/models/movie.model';
import { MovieService } from '../../../core/services/movie.service';
import { Showtime, ShowtimeService } from '../../../core/services/showtime.service';
import { DateSelectorComponent } from '../../components/date-selector/date-selector.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-showtimes',
  standalone: true,
  imports: [CommonModule, DateSelectorComponent, LoaderComponent],
  templateUrl: './showtimes.component.html',
  styleUrls: ['./showtimes.component.css']
})
export class ShowtimesComponent implements OnInit {
  movie!: Movie;
  movieId!: string;
  movieSlug!: string;
  showtimes: Showtime[] = [];
  groupedShowtimes: { [key: string]: Showtime[] } = {};
  loadingMovie = true;
  loadingShowtimes = true;
  selectedDate = new Date();
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private showtimeService: ShowtimeService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.movieId = this.route.snapshot.paramMap.get('id') || '';
    this.movieSlug = this.route.snapshot.paramMap.get('slug') || '';
    
    if (!this.movieId) {
      this.alertService.error('Movie not found');
      this.router.navigate(['/user/home']);
      return;
    }

    this.loadMovie();
    this.loadShowtimes();
  }

  onDateSelected(date: Date): void {
    this.selectedDate = date;
    this.loadShowtimes();
  }

  selectShowtime(showtime: Showtime): void {
    this.router.navigate(['/user/booking', showtime.id]);
  }

  getTheaterName(showtime: Showtime): string {
    return showtime.theater?.name || 'Theater';
  }

  getTheaterLocation(showtime: Showtime): string {
    return showtime.theater?.location || '';
  }

  getAvailabilityPercent(showtime: Showtime): number {
    if (!showtime.totalSeats) {
      return 0;
    }
    return ((showtime.totalSeats - showtime.availableSeats) / showtime.totalSeats) * 100;
  }

  getTheaterKeys(): string[] {
    return Object.keys(this.groupedShowtimes);
  }

  trackByShowId(_index: number, showtime: Showtime): string {
    return showtime.id;
  }

  trackByTheater(_index: number, theater: string): string {
    return theater;
  }

  private loadMovie(): void {
    this.loadingMovie = true;
    this.movieService.getMovieById(this.movieId).subscribe({
      next: movie => {
        this.movie = movie;
        this.loadingMovie = false;
      },
      error: (err) => {
        console.error('Error loading movie:', err);
        this.alertService.error('Unable to load movie details');
        this.loadingMovie = false;
        this.router.navigate(['/user/home']);
      }
    });
  }

  private loadShowtimes(): void {
    this.loadingShowtimes = true;
    const dateParam = this.formatDate(this.selectedDate);

    this.showtimeService.getShowtimesByMovie(this.movieId, dateParam).subscribe({
      next: showtimes => {
        this.showtimes = showtimes.filter(s => s.status === 'ACTIVE');
        this.groupShowtimesByTheater();
        this.errorMessage = this.showtimes.length ? '' : 'No showtimes available for this date.';
        this.loadingShowtimes = false;
      },
      error: (err) => {
        console.error('Error loading showtimes:', err);
        this.alertService.error('Failed to load showtimes');
        this.loadingShowtimes = false;
        this.errorMessage = 'Unable to fetch showtimes right now. Please try again later.';
      }
    });
  }

  private groupShowtimesByTheater(): void {
    this.groupedShowtimes = {};
    this.showtimes.forEach(showtime => {
      const theaterName = this.getTheaterName(showtime);
      if (!this.groupedShowtimes[theaterName]) {
        this.groupedShowtimes[theaterName] = [];
      }
      this.groupedShowtimes[theaterName].push(showtime);
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
