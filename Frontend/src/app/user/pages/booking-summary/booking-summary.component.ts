import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BookingDraft, BookingCostBreakdown } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';

@Component({
  selector: 'app-booking-summary',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-summary.component.html',
  styleUrls: ['./booking-summary.component.css']
})
export class BookingSummaryComponent implements OnInit {
  bookingDraft: BookingDraft | null = null;
  costBreakdown?: BookingCostBreakdown;

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bookingDraft = this.bookingService.getCurrentBooking();
    if (!this.bookingDraft) {
      this.router.navigate(['/user/home']);
      return;
    }

    this.costBreakdown = this.bookingService.calculateCostBreakdown(this.bookingDraft.totalAmount);
  }

  proceedToPayment(): void {
    this.router.navigate(['/user/payment']);
  }

  editSeats(): void {
    if (this.bookingDraft) {
      this.router.navigate(['/user/booking', this.bookingDraft.showtimeId]);
    }
  }
}