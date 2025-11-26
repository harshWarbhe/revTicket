import { Component, OnInit } from '@angular/core';
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
  paymentMethod = 'card';
  cardForm: FormGroup;
  upiForm: FormGroup;
  contactForm: FormGroup;
  processing = false;
  bookingDraft: BookingDraft | null = null;
  costBreakdown?: BookingCostBreakdown;
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
    this.bookingDraft = this.bookingService.getCurrentBooking();
    if (!this.bookingDraft) {
      this.router.navigate(['/user/home']);
      return;
    }

    this.costBreakdown = this.bookingService.calculateCostBreakdown(this.bookingDraft.totalAmount);
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
    this.paymentMethod = method;
  }

  processPayment(): void {
    if (!this.bookingDraft || !this.costBreakdown) {
      this.alertService.error('Booking information missing.');
      this.router.navigate(['/user/home']);
      return;
    }

    if (!this.contactForm.valid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    let methodValid = false;
    if (this.paymentMethod === 'card') {
      this.cardForm.markAllAsTouched();
      methodValid = this.cardForm.valid;
    } else if (this.paymentMethod === 'upi') {
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
      movieId: this.bookingDraft.movieId,
      theaterId: this.bookingDraft.theaterId,
      showtimeId: this.bookingDraft.showtimeId,
      showtime: new Date(this.bookingDraft.showDateTime),
      seats: this.bookingDraft.seats,
      totalAmount: this.costBreakdown.total,
      customerName: contact.name,
      customerEmail: contact.email,
      customerPhone: contact.phone
    };

    this.processing = true;
    this.bookingService.createBooking(bookingRequest)
      .pipe(finalize(() => this.processing = false))
      .subscribe({
        next: booking => {
          const confirmation = this.bookingService.buildConfirmationFromDraft(
            booking,
            this.bookingDraft!,
            this.costBreakdown!.total
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