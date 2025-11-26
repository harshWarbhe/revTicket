import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SeatSelectorComponent } from '../../components/seat-selector/seat-selector.component';
import { Showtime, ShowtimeService } from '../../../core/services/showtime.service';
import { BookingDraft } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { AlertService } from '../../../core/services/alert.service';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';

@Component({
  selector: 'app-seat-booking',
  standalone: true,
  imports: [CommonModule, SeatSelectorComponent, LoaderComponent],
  templateUrl: './seat-booking.component.html',
  styleUrls: ['./seat-booking.component.css']
})
export class SeatBookingComponent implements OnInit {
  showtimeId!: string;
  showtime: Showtime | null = null;
  movieInfo: {
    title: string;
    posterUrl?: string;
    rating?: number;
    duration?: number;
    genre?: string[];
    language?: string;
  } = {
    title: '',
    posterUrl: '',
    rating: 0,
    duration: 0,
    genre: [],
    language: ''
  };
  theaterName = '';
  theaterLocation = '';
  selectedSeats: string[] = [];
  selectedSeatLabels: string[] = [];
  totalAmount = 0;
  loading = true;
  showDateTime: Date | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private showtimeService: ShowtimeService,
    private bookingService: BookingService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.showtimeId = this.route.snapshot.paramMap.get('showtimeId') || '';
    if (!this.showtimeId) {
      this.alertService.error('Invalid showtime selected');
      this.router.navigate(['/user/home']);
      return;
    }
    this.loadShowtime();
  }

  onSeatsSelected(seats: string[]): void {
    this.selectedSeats = seats;
  }

  onSeatLabelsChanged(labels: string[]): void {
    this.selectedSeatLabels = labels;
  }

  onTotalAmountChanged(amount: number): void {
    this.totalAmount = amount;
  }

  proceedToPayment(): void {
    if (this.selectedSeats.length === 0) {
      this.alertService.error('Please select at least one seat to continue.');
      return;
    }

    if (!this.showtime) {
      this.alertService.error('Showtime information not available.');
      return;
    }

    const draft: BookingDraft = {
      showtimeId: this.showtimeId,
      showDateTime: this.showtime.showDateTime,
      movieId: this.showtime.movieId,
      movieTitle: this.movieInfo.title || 'Movie',
      moviePosterUrl: this.movieInfo.posterUrl,
      theaterId: this.showtime.theaterId,
      theaterName: this.theaterName,
      theaterLocation: this.theaterLocation,
      screen: this.showtime.screen,
      seats: [...this.selectedSeatLabels],
      totalAmount: this.totalAmount
    };

    this.bookingService.setCurrentBooking(draft);
    this.router.navigate(['/user/booking-summary']);
  }

  private loadShowtime(): void {
    this.loading = true;
    this.showtimeService.getShowtimeById(this.showtimeId).subscribe({
      next: showtime => {
        this.showtime = showtime;
        this.showDateTime = new Date(showtime.showDateTime);
        this.theaterName = showtime.theater?.name || '';
        this.theaterLocation = showtime.theater?.location || '';
        this.movieInfo = {
          title: showtime.movie?.title || '',
          posterUrl: showtime.movie?.posterUrl,
          rating: showtime.movie?.rating,
          duration: showtime.movie?.duration,
          genre: showtime.movie?.genre || [],
          language: showtime.movie?.language
        };
        this.loading = false;
      },
      error: () => {
        this.alertService.error('Unable to load showtime details');
        this.router.navigate(['/user/home']);
      }
    });
  }
}
