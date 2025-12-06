import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../../../core/models/booking.model';
import { ETicketComponent } from '../../components/e-ticket/e-ticket.component';
import { SettingsService } from '../../../core/services/settings.service';

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
  bookings = signal<BookingCard[]>([]);
  activeFilter = signal<'all' | 'upcoming' | 'past' | 'cancelled'>('all');
  searchTerm = signal('');
  loading = signal(true);
  selectedBooking = signal<BookingCard | null>(null);
  showTicket = signal(false);
  
  filteredBookings = computed(() => {
    let filtered = [...this.bookings()];
    const now = new Date();
    const filter = this.activeFilter();
    const term = this.searchTerm().toLowerCase();

    if (filter !== 'all') {
      filtered = filtered.filter(booking => {
        const showtime = new Date(booking.showtime);
        switch (filter) {
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

    if (term) {
      filtered = filtered.filter(booking =>
        booking.movieTitle.toLowerCase().includes(term) ||
        booking.theaterName.toLowerCase().includes(term)
      );
    }

    return filtered;
  });

  private alertService = inject(AlertService);
  private bookingService = inject(BookingService);
  private route = inject(ActivatedRoute);
  private settingsService = inject(SettingsService);

  onImageError(event: any): void {
    event.target.src = 'assets/images/movies/default-poster.png';
  }

  ngOnInit(): void {
    this.fetchBookings();
    
    // Check if ticket parameter exists (from QR code scan)
    this.route.queryParams.subscribe(params => {
      const ticketId = params['ticket'];
      if (ticketId) {
        // Wait for bookings to load, then show the ticket
        setTimeout(() => {
          const booking = this.bookings().find(b => b.id === ticketId);
          if (booking) {
            this.viewTicket(booking);
          } else {
            this.alertService.error('Ticket not found');
          }
        }, 1000);
      }
    });
  }

  setFilter(filter: 'all' | 'upcoming' | 'past' | 'cancelled'): void {
    this.activeFilter.set(filter);
  }

  downloadTicket(booking: BookingCard): void {
    const ticketContent = this.generateTicketHTML(booking);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(ticketContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  private generateTicketHTML(booking: BookingCard): string {
    const seatDisplay = booking.seatLabels?.length ? booking.seatLabels.join(', ') : booking.seats.join(', ');
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>E-Ticket - ${booking.ticketNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
          .ticket { border: 2px dashed #333; padding: 30px; border-radius: 10px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 32px; }
          .ticket-number { background: #f0f0f0; padding: 10px; margin-top: 10px; font-weight: bold; }
          .movie-title { font-size: 24px; color: #2196f3; text-align: center; margin: 20px 0; }
          .details { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #666; }
          .value { color: #333; }
          .seats { background: #e3f2fd; padding: 5px 10px; border-radius: 5px; font-weight: bold; }
          .amount { font-size: 20px; color: #4caf50; font-weight: bold; }
          .qr-section { text-align: center; margin: 30px 0; padding: 20px; background: #f9f9f9; }
          .qr-code { width: 150px; height: 150px; margin: 0 auto; border: 2px solid #333; display: flex; align-items: center; justify-content: center; background: white; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #333; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h1>🎬 E-TICKET</h1>
            <div class="ticket-number">Ticket #${booking.ticketNumber || 'N/A'}</div>
          </div>
          
          <div class="movie-title">${booking.movieTitle}</div>
          
          <div class="details">
            <div class="row">
              <span class="label">Theater:</span>
              <span class="value">${booking.theaterName}</span>
            </div>
            <div class="row">
              <span class="label">Screen:</span>
              <span class="value">${booking.screen || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Date & Time:</span>
              <span class="value">${new Date(booking.showtime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div class="row">
              <span class="label">Seats:</span>
              <span class="value seats">${seatDisplay}</span>
            </div>
            <div class="row">
              <span class="label">Total Amount:</span>
              <span class="value amount">₹${booking.totalAmount}</span>
            </div>
          </div>
          
          <div class="details">
            <div class="row">
              <span class="label">Customer Name:</span>
              <span class="value">${booking.customerName}</span>
            </div>
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">${booking.customerEmail}</span>
            </div>
            <div class="row">
              <span class="label">Phone:</span>
              <span class="value">${booking.customerPhone}</span>
            </div>
          </div>
          
          <div class="qr-section">
            <div class="qr-code">
              <div style="font-size: 10px; font-weight: bold;">${booking.qrCode || booking.id}</div>
            </div>
            <p style="margin-top: 10px; font-size: 14px;">Show this at theater entrance</p>
          </div>
          
          <div class="footer">
            <p><strong>Important Instructions:</strong></p>
            <p>• Please arrive 30 minutes before showtime</p>
            <p>• Outside food and beverages are not allowed</p>
            <p>• This ticket is non-transferable</p>
            <p style="margin-top: 15px;">Booking ID: ${booking.id}</p>
            <p>Booking Date: ${new Date(booking.bookingDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  viewTicket(booking: BookingCard): void {
    this.selectedBooking.set(booking);
    this.showTicket.set(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const modalContent = document.querySelector('.modal-content');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 100);
  }

  closeTicket(): void {
    this.showTicket.set(false);
    this.selectedBooking.set(null);
    document.body.style.overflow = '';
  }

  viewDetails(_booking: BookingCard): void {
    this.alertService.info('Detailed booking view coming soon.');
  }

  canCancel(booking: BookingCard): boolean {
    if (booking.status !== 'CONFIRMED') {
      return false;
    }
    return this.settingsService.canCancelBooking(booking.showtime);
  }

  isPendingCancellation(booking: BookingCard): boolean {
    return booking.status === 'CANCELLATION_PENDING';
  }

  cancelBooking(booking: BookingCard): void {
    if (!this.canCancel(booking)) {
      this.alertService.error('This booking cannot be cancelled.');
      return;
    }

    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason?.trim()) {
      return;
    }

    const seatDisplay = booking.seatLabels?.length ? booking.seatLabels.join(', ') : booking.seats.join(', ');
    const confirmMessage = `Cancel booking for ${booking.movieTitle} on ${new Date(booking.showtime).toLocaleString()}?\nSeats: ${seatDisplay}\nReason: ${reason}`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    console.log('Requesting cancellation for booking:', booking.id, 'Reason:', reason);
    this.bookingService.requestCancellation(booking.id, reason).subscribe({
      next: updated => {
        console.log('Cancellation response:', updated);
        const normalized = this.bookingService.normalizeBookingDates(updated) as BookingCard;
        this.bookings.update(bookings => 
          bookings.map(b => b.id === normalized.id ? { ...b, ...normalized } : b)
        );
        this.alertService.success('Cancellation request submitted. Admin will review and process your request.');
      },
      error: (err) => {
        console.error('Cancellation error:', err);
        const errorMsg = err.error?.message || err.message || 'Unable to submit cancellation request';
        this.alertService.error(errorMsg);
      }
    });
  }

  getRefundInfo(booking: BookingCard): string {
    if (!booking.refundAmount || !booking.refundDate) {
      return '';
    }
    const date = new Date(booking.refundDate).toLocaleDateString();
    return `Refunded ₹${booking.refundAmount} on ${date}`;
  }

  getUpcomingCount(): number {
    const now = new Date();
    return this.bookings().filter(b => 
      new Date(b.showtime) > now && b.status === 'CONFIRMED'
    ).length;
  }

  getPastCount(): number {
    const now = new Date();
    return this.bookings().filter(b => new Date(b.showtime) <= now).length;
  }

  getCancelledCount(): number {
    return this.bookings().filter(b => b.status === 'CANCELLED').length;
  }

  isUpcoming(booking: BookingCard): boolean {
    return new Date(booking.showtime) > new Date() && booking.status === 'CONFIRMED';
  }

  isPast(booking: BookingCard): boolean {
    return new Date(booking.showtime) <= new Date();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'CONFIRMED': 'Confirmed',
      'CANCELLED': 'Cancelled',
      'PENDING': 'Pending',
      'CANCELLATION_PENDING': 'Cancellation Pending'
    };
    return labels[status] || status;
  }

  formatShowtime(date: string | Date): string {
    return new Date(date).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return this.settingsService.formatCurrency(amount);
  }

  getSeatLabels(booking: BookingCard): string[] {
    return booking.seatLabels && booking.seatLabels.length > 0 
      ? booking.seatLabels 
      : booking.seats || [];
  }

  getEmptyStateTitle(): string {
    if (this.searchTerm()) return 'No Results Found';
    switch (this.activeFilter()) {
      case 'upcoming': return 'No Upcoming Shows';
      case 'past': return 'No Past Bookings';
      case 'cancelled': return 'No Cancelled Bookings';
      default: return 'No Bookings Yet';
    }
  }

  getEmptyStateMessage(): string {
    if (this.searchTerm()) {
      return 'Try adjusting your search terms or filters';
    }
    switch (this.activeFilter()) {
      case 'upcoming':
        return 'Book tickets for upcoming movies to see them here';
      case 'past':
        return 'Your watched movies will appear here';
      case 'cancelled':
        return 'You have no cancelled bookings';
      default:
        return 'Start your movie journey by booking your first ticket';
    }
  }

  private fetchBookings(): void {
    this.loading.set(true);
    this.bookingService.getUserBookings().subscribe({
      next: bookings => {
        this.bookings.set(bookings.map(b => this.bookingService.normalizeBookingDates(b)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alertService.error('Unable to load bookings.');
      }
    });
  }
}