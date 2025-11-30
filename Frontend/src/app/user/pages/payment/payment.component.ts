import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingDraft, BookingCostBreakdown, BookingRequest } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  paymentMethod = signal('card');
  cardForm: FormGroup;
  upiForm: FormGroup;
  contactForm: FormGroup;
  processing = signal(false);
  bookingDraft = signal<BookingDraft | null>(null);
  costBreakdown = signal<BookingCostBreakdown | undefined>(undefined);
  readonly monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly yearOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + i);

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private bookingService: BookingService,
    private authService: AuthService,
    private alertService: AlertService
  ) {
    this.cardForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      expiryMonth: ['', [Validators.required, Validators.min(1), Validators.max(12)]],
      expiryYear: ['', [Validators.required, Validators.min(new Date().getFullYear())]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardholderName: ['', Validators.required]
    });

    this.upiForm = this.fb.group({
      upiId: ['', [Validators.required, Validators.pattern(/^[\w.-]+@[\w.-]+$/)]]
    });

    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const draft = this.bookingService.getCurrentBooking();
    this.bookingDraft.set(draft);
    if (!draft) {
      this.router.navigate(['/user/home']);
      return;
    }

    this.costBreakdown.set(this.bookingService.calculateCostBreakdown(draft.totalAmount));
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.contactForm.patchValue({
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || ''
      });
    }
  }

  onPaymentMethodChange(method: string): void {
    this.paymentMethod.set(method);
  }

  processPayment(): void {
    const draft = this.bookingDraft();
    const breakdown = this.costBreakdown();
    
    if (!draft || !breakdown) {
      this.alertService.error('Booking information missing.');
      this.router.navigate(['/user/home']);
      return;
    }

    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    let methodValid = false;
    const method = this.paymentMethod();
    if (method === 'card') {
      this.cardForm.markAllAsTouched();
      methodValid = this.cardForm.valid;
    } else if (method === 'upi') {
      this.upiForm.markAllAsTouched();
      methodValid = this.upiForm.valid;
    } else {
      methodValid = true;
    }

    if (!methodValid) {
      return;
    }

    const contact = this.contactForm.value;
    const bookingRequest: BookingRequest = {
      movieId: draft.movieId,
      theaterId: draft.theaterId,
      showtimeId: draft.showtimeId,
      showtime: new Date(draft.showDateTime),
      seats: draft.seats,
      totalAmount: breakdown.total,
      customerName: contact.name,
      customerEmail: contact.email,
      customerPhone: contact.phone
    };

    this.processing.set(true);
    this.bookingService.createBooking(bookingRequest)
      .pipe(finalize(() => this.processing.set(false)))
      .subscribe({
        next: booking => {
          const confirmation = this.bookingService.buildConfirmationFromDraft(
            booking,
            draft,
            breakdown.total
          );
          this.bookingService.setLastConfirmedBooking(confirmation);
          this.bookingService.clearCurrentBooking();
          this.alertService.success('Payment successful!');
          this.router.navigate(['/user/success', booking.id]);
        },
        error: () => {
          this.alertService.error('Payment failed. Please try again.');
        }
      });
  }
}