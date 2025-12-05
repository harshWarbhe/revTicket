import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { BookingDraft, BookingCostBreakdown, BookingRequest } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { SettingsService } from '../../../core/services/settings.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  readonly settingsService = inject(SettingsService);

  paymentMethod = signal('card');
  cardForm: FormGroup;
  upiForm: FormGroup;
  contactForm: FormGroup;
  processing = signal(false);
  bookingDraft = signal<BookingDraft | null>(null);
  costBreakdown = signal<BookingCostBreakdown | undefined>(undefined);
  showtimeId = '';
  readonly monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly yearOptions = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + i);

  constructor() {
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
    
    const showtimeId = this.route.snapshot.paramMap.get('showtimeId');
    if (!showtimeId) {
      this.alertService.error('Invalid booking session.');
      this.router.navigate(['/user/home']);
      return;
    }
    
    this.showtimeId = showtimeId;
    const draft = this.bookingService.getCurrentBooking();
    console.log('Payment component - booking draft:', draft);
    
    if (!draft || draft.showtimeId !== showtimeId) {
      console.log('No valid booking draft found, redirecting to seat booking');
      this.alertService.error('Booking session expired. Please select seats again.');
      this.router.navigate(['/user/seat-booking', showtimeId]);
      return;
    }
    
    this.bookingDraft.set(draft);
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
      this.alertService.error('Please fill in all contact details.');
      return;
    }

    let methodValid = false;
    const method = this.paymentMethod();
    if (method === 'card') {
      this.cardForm.markAllAsTouched();
      methodValid = this.cardForm.valid;
      if (!methodValid) {
        this.alertService.error('Please fill in all card details correctly.');
        return;
      }
    } else if (method === 'upi') {
      this.upiForm.markAllAsTouched();
      methodValid = this.upiForm.valid;
      if (!methodValid) {
        this.alertService.error('Please enter a valid UPI ID.');
        return;
      }
    } else {
      methodValid = true;
    }

    const contact = this.contactForm.value;
    const bookingRequest: BookingRequest = {
      movieId: draft.movieId,
      theaterId: draft.theaterId,
      showtimeId: draft.showtimeId,
      showtime: new Date(draft.showDateTime),
      seats: draft.seats,
      seatLabels: draft.seatLabels,
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
          this.alertService.success('🎉 Payment successful! Booking confirmed.');
          
          const movieSlug = this.createSlug(draft.movieTitle);
          const bookingSlug = `booking-${booking.id.slice(-8)}`;
          
          this.router.navigate(['/user/success', movieSlug, bookingSlug]);
        },
        error: (err) => {
          const errorMsg = err?.error?.message || err?.message || 'Payment failed. Please try again.';
          this.alertService.error(errorMsg);
          
          if (errorMsg.includes('no longer available') || errorMsg.includes('already booked')) {
            setTimeout(() => {
              this.router.navigate(['/user/seat-booking', this.showtimeId]);
            }, 2000);
          }
        }
      });
  }
  
  private createSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  goBack(): void {
    if (this.showtimeId) {
      this.router.navigate(['/user/seat-booking', this.showtimeId]);
    } else {
      this.router.navigate(['/user/home']);
    }
  }
}