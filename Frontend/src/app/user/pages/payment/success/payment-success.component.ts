import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingDraft } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.css']
})
export class PaymentSuccessComponent implements OnInit {
  private router = inject(Router);
  
  bookingId = signal<string>('');
  ticketNumber = signal<string>('');
  draft = signal<BookingDraft | null>(null);
  amount = signal<number>(0);
  showAnimation = signal(true);

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (!state || !state.bookingId) {
      this.router.navigate(['/user/home']);
      return;
    }

    this.bookingId.set(state.bookingId);
    this.ticketNumber.set(state.ticketNumber);
    this.draft.set(state.draft);
    this.amount.set(state.amount);

    setTimeout(() => this.showAnimation.set(false), 2000);
  }

  viewTicket(): void {
    this.router.navigate(['/user/my-bookings']);
  }
}
