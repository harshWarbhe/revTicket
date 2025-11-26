import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';
import { ETicketComponent } from '../../components/e-ticket/e-ticket.component';

type BookingCard = Booking & {
  moviePosterUrl?: string;
};

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ETicketComponent],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css'],
  providers: [DatePipe]
})
export class MyBookingsComponent implements OnInit {
  bookings: BookingCard[] = [];
  filteredBookings: BookingCard[] = [];
  activeFilter: 'all' | 'upcoming' | 'past' | 'cancelled' = 'all';
  searchTerm = '';
  loading = true;

  selectedBooking: BookingCard | null = null;
  showTicket = false;

  constructor(
    private alertService: AlertService,
    private bookingService: BookingService
  ) {}

  onImageError(event: any): void {
    event.target.src = 'assets/images/movies/default-poster.png';
  }

  ngOnInit(): void {
    this.fetchBookings();
  }

  setFilter(filter: 'all' | 'upcoming' | 'past' | 'cancelled'): void {
    this.activeFilter = filter;
    this.filterBookings();
  }

  onSearch(): void {
    this.filterBookings();
  }

  downloadTicket(_booking: BookingCard): void {
    this.alertService.success('Ticket ready to download!');
  }

  viewTicket(booking: BookingCard): void {
    this.selectedBooking = booking;
    this.showTicket = true;
  }

  closeTicket(): void {
    this.showTicket = false;
    this.selectedBooking = null;
  }

  viewDetails(_booking: BookingCard): void {
    this.alertService.info('Detailed booking view coming soon.');
  }

  canCancel(booking: BookingCard): boolean {
    if (booking.status !== 'CONFIRMED') {
      return false;
    }
    const showtime = new Date(booking.showtime);
    const now = new Date();
    return showtime.getTime() - now.getTime() > 2 * 60 * 60 * 1000;
  }

  cancelBooking(booking: BookingCard): void {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) {
      return;
    }

    const confirmMessage = `Cancel booking for ${booking.movieTitle} on ${new Date(booking.showtime).toLocaleString()}?\nSeats: ${booking.seats.join(', ')}\nReason: ${reason}`;
    if (!confirm(confirmMessage)) {
      return;
    }

    this.bookingService.cancelBooking(booking.id, reason).subscribe({
      next: updated => {
        const normalized = this.bookingService.normalizeBookingDates(updated);
        this.bookings = this.bookings.map(b => (b.id === normalized.id ? normalized : b));
        this.filterBookings();
        this.alertService.success('Booking cancelled. Refund (if applicable) will be processed shortly.');
      },
      error: () => this.alertService.error('Unable to cancel booking. Please try again.')
    });
  }

  getRefundInfo(booking: BookingCard): string {
    if (!booking.refundAmount || !booking.refundDate) {
      return '';
    }
    const date = new Date(booking.refundDate).toLocaleDateString();
    return `Refunded ₹${booking.refundAmount} on ${date}`;
  }

  getEmptyStateMessage(): string {
    switch (this.activeFilter) {
      case 'upcoming':
        return 'No upcoming bookings found.';
      case 'past':
        return 'No past bookings found.';
      case 'cancelled':
        return 'No cancelled bookings found.';
      default:
        return this.searchTerm
          ? 'No bookings match your search.'
          : 'No bookings yet. Start exploring movies!';
    }
  }

  private fetchBookings(): void {
    this.loading = true;
    this.bookingService.getUserBookings().subscribe({
      next: bookings => {
        this.bookings = bookings.map(b => this.bookingService.normalizeBookingDates(b));
        this.loading = false;
        this.filterBookings();
      },
      error: () => {
        this.loading = false;
        this.alertService.error('Unable to load bookings.');
      }
    });
  }

  private filterBookings(): void {
    let filtered = [...this.bookings];
    const now = new Date();

    if (this.activeFilter !== 'all') {
      filtered = filtered.filter(booking => {
        const showtime = new Date(booking.showtime);
        switch (this.activeFilter) {
          case 'upcoming':
            return showtime > now && booking.status === 'CONFIRMED';
          case 'past':
            return showtime <= now;
          case 'cancelled':
            return booking.status === 'CANCELLED';
          default:
            return true;
        }
      });
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(booking =>
        booking.movieTitle.toLowerCase().includes(term) ||
        booking.theaterName.toLowerCase().includes(term)
      );
    }

    this.filteredBookings = filtered;
  }
}