import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, BookingConfirmation } from '../../../core/models/booking.model';

interface BookingViewModel {
  id: string;
  movieTitle: string;
  moviePosterUrl?: string;
  theaterName: string;
  theaterLocation?: string;
  screen?: string;
  showtime: Date;
  seats: string[];
  seatLabels?: string[];
  ticketPrice?: number;
  convenienceFee: number;
  gst: number;
  totalAmount: number;
}

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-success.component.html',
  styleUrls: ['./booking-success.component.css']
})
export class BookingSuccessComponent implements OnInit {
  bookingId = signal('');
  booking = signal<BookingViewModel | null>(null);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('bookingId') || '';
    this.bookingId.set(id);
    if (!id) {
      this.router.navigate(['/user/home']);
      return;
    }

    const confirmation = this.bookingService.getLastConfirmedBooking();
    if (confirmation && confirmation.bookingId === id) {
      this.booking.set(this.buildViewModelFromConfirmation(confirmation));
      this.loading.set(false);
    } else {
      this.fetchBooking();
    }
  }

  downloadTicket(): void {
    this.alertService.success('Ticket downloaded successfully!');
  }

  sendToEmail(): void {
    this.alertService.success('Ticket sent to email successfully!');
  }

  private fetchBooking(): void {
    this.bookingService.getBookingById(this.bookingId()).subscribe({
      next: booking => {
        this.booking.set(this.buildViewModelFromBooking(booking));
        this.loading.set(false);
      },
      error: () => {
        this.alertService.error('Unable to find booking details.');
        this.router.navigate(['/user/home']);
      }
    });
  }

  private buildViewModelFromConfirmation(confirmation: BookingConfirmation): BookingViewModel {
    return {
      id: confirmation.bookingId,
      movieTitle: confirmation.movieTitle,
      moviePosterUrl: confirmation.moviePosterUrl,
      theaterName: confirmation.theaterName,
      theaterLocation: confirmation.theaterLocation,
      screen: confirmation.screen,
      showtime: new Date(confirmation.showtime),
      seats: confirmation.seats,
      seatLabels: confirmation.seatLabels,
      ticketPrice: undefined,
      convenienceFee: 0,
      gst: 0,
      totalAmount: confirmation.totalAmount
    };
  }

  private buildViewModelFromBooking(booking: Booking): BookingViewModel {
    const normalized = this.bookingService.normalizeBookingDates(booking);
    return {
      id: normalized.id,
      movieTitle: normalized.movieTitle,
      moviePosterUrl: normalized.moviePosterUrl,
      theaterName: normalized.theaterName,
      theaterLocation: normalized.theaterLocation,
      screen: normalized.screen,
      showtime: normalized.showtime as Date,
      seats: normalized.seats,
      seatLabels: (normalized as any).seatLabels,
      ticketPrice: normalized.ticketPrice,
      convenienceFee: Math.round((normalized.totalAmount || 0) * 0.05),
      gst: Math.round((normalized.totalAmount || 0) * 0.18),
      totalAmount: normalized.totalAmount
    };
  }
}