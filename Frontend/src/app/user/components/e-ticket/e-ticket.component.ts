import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Booking } from '../../../core/models/booking.model';

@Component({
  selector: 'app-e-ticket',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="e-ticket" *ngIf="booking">
      <div class="ticket-header">
        <h2>E-TICKET</h2>
        <div class="ticket-number">{{booking.ticketNumber}}</div>
      </div>

      <div class="movie-details">
        <h3>{{booking.movieTitle}}</h3>
        <div class="show-info">
          <div class="info-row">
            <span class="label">Theater:</span>
            <span>{{booking.theaterName}}</span>
          </div>
          <div class="info-row">
            <span class="label">Date & Time:</span>
            <span>{{formatDateTime(booking.showtime)}}</span>
          </div>
          <div class="info-row">
            <span class="label">Seats:</span>
            <span class="seats">{{booking.seats.join(', ')}}</span>
          </div>
        </div>
      </div>

      <div class="customer-details">
        <h4>Customer Details</h4>
        <div class="info-row">
          <span class="label">Name:</span>
          <span>{{booking.customerName}}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span>{{booking.customerEmail}}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span>{{booking.customerPhone}}</span>
        </div>
      </div>

      <div class="payment-details">
        <div class="info-row">
          <span class="label">Total Amount:</span>
          <span class="amount">₹{{booking.totalAmount}}</span>
        </div>
        <div class="info-row">
          <span class="label">Booking ID:</span>
          <span>{{booking.id}}</span>
        </div>
        <div class="info-row">
          <span class="label">Booking Date:</span>
          <span>{{formatDate(booking.bookingDate)}}</span>
        </div>
      </div>

      <div class="qr-section">
        <div class="qr-code">
          <div class="qr-placeholder">
            <div class="qr-pattern"></div>
            <div class="qr-text">{{booking.qrCode}}</div>
          </div>
        </div>
        <p class="qr-instruction">Show this QR code at the theater entrance</p>
      </div>

      <div class="ticket-footer">
        <div class="status" [ngClass]="booking.status.toLowerCase()">
          Status: {{booking.status | titlecase}}
        </div>
        <div class="terms">
          <small>
            • Please arrive 30 minutes before showtime<br>
            • Outside food and beverages are not allowed<br>
            • This ticket is non-transferable
          </small>
        </div>
      </div>

      <div class="actions">
        <button (click)="downloadTicket()" class="download-btn">Download PDF</button>
        <button (click)="shareTicket()" class="share-btn">Share</button>
        <button *ngIf="canCancel()" (click)="cancelTicket()" class="cancel-btn">Cancel Booking</button>
      </div>
    </div>
  `,
  styles: [`
    .e-ticket {
      max-width: 400px;
      margin: 0 auto;
      background: white;
      border: 2px dashed #ccc;
      border-radius: 10px;
      padding: 20px;
      font-family: 'Courier New', monospace;
    }
    .ticket-header {
      text-align: center;
      border-bottom: 1px solid #ddd;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .ticket-header h2 {
      margin: 0;
      color: #333;
      font-size: 24px;
    }
    .ticket-number {
      background: #f0f0f0;
      padding: 5px 10px;
      border-radius: 5px;
      margin-top: 10px;
      font-weight: bold;
    }
    .movie-details h3 {
      margin: 0 0 15px 0;
      color: #2196f3;
      text-align: center;
      font-size: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      padding: 5px 0;
    }
    .label {
      font-weight: bold;
      color: #666;
    }
    .seats {
      background: #e3f2fd;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: bold;
    }
    .amount {
      font-size: 18px;
      font-weight: bold;
      color: #4caf50;
    }
    .customer-details, .payment-details {
      margin: 20px 0;
      padding: 15px 0;
      border-top: 1px solid #eee;
    }
    .customer-details h4 {
      margin: 0 0 10px 0;
      color: #333;
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
      padding: 20px 0;
      border-top: 1px solid #eee;
    }
    .qr-code {
      display: inline-block;
      margin-bottom: 10px;
    }
    .qr-placeholder {
      width: 120px;
      height: 120px;
      border: 2px solid #333;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f9f9f9;
    }
    .qr-pattern {
      width: 80px;
      height: 80px;
      background: 
        repeating-linear-gradient(0deg, #000, #000 2px, transparent 2px, transparent 4px),
        repeating-linear-gradient(90deg, #000, #000 2px, transparent 2px, transparent 4px);
      margin-bottom: 5px;
    }
    .qr-text {
      font-size: 8px;
      font-weight: bold;
    }
    .qr-instruction {
      font-size: 12px;
      color: #666;
      margin: 0;
    }
    .ticket-footer {
      border-top: 1px solid #eee;
      padding-top: 15px;
      margin-top: 20px;
    }
    .status {
      text-align: center;
      padding: 8px;
      border-radius: 5px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .status.confirmed { background: #e8f5e8; color: #4caf50; }
    .status.pending { background: #fff3e0; color: #ff9800; }
    .status.cancelled { background: #ffebee; color: #f44336; }
    .terms {
      font-size: 10px;
      color: #666;
      text-align: center;
    }
    .actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .actions button {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    }
    .download-btn { background: #2196f3; color: white; }
    .share-btn { background: #4caf50; color: white; }
    .cancel-btn { background: #f44336; color: white; }
  `]
})
export class ETicketComponent {
  @Input() booking!: Booking;

  formatDateTime(date: string | Date): string {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-IN');
  }

  canCancel(): boolean {
    if (this.booking.status !== 'CONFIRMED') return false;
    const showTime = new Date(this.booking.showtime);
    const now = new Date();
    return showTime.getTime() - now.getTime() > 4 * 60 * 60 * 1000; // 4 hours before show
  }

  downloadTicket(): void {
    // Implementation for PDF download
    window.print();
  }

  shareTicket(): void {
    if (navigator.share) {
      navigator.share({
        title: `Movie Ticket - ${this.booking.movieTitle}`,
        text: `Booking confirmed for ${this.booking.movieTitle} on ${this.formatDateTime(this.booking.showtime)}`,
        url: window.location.href
      });
    }
  }

  cancelTicket(): void {
    // Emit event to parent component for cancellation
    const event = new CustomEvent('cancelBooking', { detail: this.booking.id });
    document.dispatchEvent(event);
  }
}