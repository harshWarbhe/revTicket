import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { BookingDraft } from '../../../../core/models/booking.model';

@Component({
  selector: 'app-payment-failure',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-failure.component.html',
  styleUrls: ['./payment-failure.component.css']
})
export class PaymentFailureComponent implements OnInit {
  private router = inject(Router);
  
  draft = signal<BookingDraft | null>(null);
  showAnimation = signal(true);

  ngOnInit(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.draft) {
      this.draft.set(state.draft);
    }

    setTimeout(() => this.showAnimation.set(false), 1500);
  }

  retryPayment(): void {
    const draftData = this.draft();
    if (draftData?.showtimeId) {
      this.router.navigate(['/user/payment', draftData.showtimeId]);
    } else {
      this.router.navigate(['/user/home']);
    }
  }

  goHome(): void {
    this.router.navigate(['/user/home']);
  }
}
