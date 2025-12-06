import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { AlertService } from '../../../core/services/alert.service';

interface BookingData {
  id: string;
  ticketNumber?: string;
  movieTitle: string;
  moviePosterUrl?: string;
  theaterName: string;
  theaterLocation?: string;
  screen?: string;
  showtime: Date | string;
  seatLabels?: string[];
  seats: string[];
  totalAmount: number;
  bookingDate: Date | string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cancellationReason?: string;
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
})
export class BookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private alertService = inject(AlertService);

  bookings = signal<BookingData[]>([]);
  filteredBookings = signal<BookingData[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  filterStatus = signal('ALL');

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.bookingService.getAllBookings().subscribe({
      next: (bookings) => {
        const sorted = bookings.sort((a, b) => 
          new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime()
        );
        this.bookings.set(sorted);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.alertService.error('Failed to load bookings');
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = this.bookings();

    if (this.filterStatus() !== 'ALL') {
      filtered = filtered.filter(b => b.status === this.filterStatus());
    }

    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(b =>
        b.id?.toLowerCase().includes(term) ||
        b.ticketNumber?.toLowerCase().includes(term) ||
        b.movieTitle?.toLowerCase().includes(term) ||
        b.customerName?.toLowerCase().includes(term) ||
        b.customerEmail?.toLowerCase().includes(term) ||
        b.customerPhone?.toLowerCase().includes(term) ||
        b.theaterName?.toLowerCase().includes(term)
      );
    }

    this.filteredBookings.set(filtered);
  }

  searchBookings(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  filterByStatus(status: string): void {
    this.filterStatus.set(status);
    this.applyFilters();
  }

  getStatusCount(status: string): number {
    if (status === 'ALL') return this.bookings().length;
    return this.bookings().filter(b => b.status === status).length;
  }

  formatShowtime(date: Date | string): string {
    return new Date(date).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  canCancelBooking(booking: BookingData): boolean {
    if (booking.status !== 'CONFIRMED') return false;
    const showtime = new Date(booking.showtime);
    const now = new Date();
    return showtime > now;
  }

  cancelBooking(booking: BookingData): void {
    if (!this.canCancelBooking(booking)) {
      this.alertService.error('Cannot cancel booking. Show has already started or passed.');
      return;
    }

    const confirmMsg = `Cancel booking for ${booking.customerName}?\n\nMovie: ${booking.movieTitle}\nSeats: ${(booking.seatLabels || booking.seats).join(', ')}\nAmount: ${this.formatCurrency(booking.totalAmount)}`;
    
    if (!confirm(confirmMsg)) return;

    this.bookingService.cancelBooking(booking.id).subscribe({
      next: () => {
        this.alertService.success('Booking cancelled successfully. Seats have been freed.');
        this.loadBookings();
      },
      error: (err) => {
        console.error('Cancel error:', err);
        this.alertService.error('Failed to cancel booking. Please try again.');
      }
    });
  }

  approveCancellation(booking: BookingData): void {
    if (!confirm(`Approve cancellation request for ${booking.customerName}?`)) return;

    this.bookingService.cancelBooking(booking.id, 'Approved by admin').subscribe({
      next: () => {
        this.alertService.success('Cancellation approved. Refund processed.');
        this.loadBookings();
      },
      error: () => {
        this.alertService.error('Failed to approve cancellation');
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getScreenLabel(screen?: string): string {
    if (!screen) return 'N/A';
    if (screen.length === 36 && screen.includes('-')) {
      return 'Screen 1';
    }
    return screen;
  }

  getSeatLabels(booking: BookingData): string {
    const seats = booking.seatLabels || booking.seats;
    if (!seats || seats.length === 0) return 'N/A';
    
    const seatLabels = seats.map(seat => {
      if (seat.length === 36 && seat.includes('-')) {
        const index = seats.indexOf(seat);
        const row = String.fromCharCode(65 + Math.floor(index / 10));
        const col = (index % 10) + 1;
        return `${row}${col}`;
      }
      return seat;
    });
    
    return seatLabels.join(', ');
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }
}
