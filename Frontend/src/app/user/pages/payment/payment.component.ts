import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { BookingDraft, BookingCostBreakdown } from '../../../core/models/booking.model';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { SettingsService } from '../../../core/services/settings.service';
import { RazorpayService } from '../../../core/services/razorpay.service';
import { finalize } from 'rxjs/operators';

declare var Razorpay: any;

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
  private razorpayService = inject(RazorpayService);
  readonly settingsService = inject(SettingsService);

  contactForm: FormGroup;
  processing = signal(false);
  bookingDraft = signal<BookingDraft | null>(null);
  costBreakdown = signal<BookingCostBreakdown | undefined>(undefined);
  showtimeId = '';
  razorpayLoaded = signal(false);

  constructor() {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
  }

  async ngOnInit(): Promise<void> {
    window.scrollTo(0, 0);
    
    const showtimeId = this.route.snapshot.paramMap.get('showtimeId');
    if (!showtimeId) {
      this.alertService.error('Invalid booking session.');
      this.router.navigate(['/user/home']);
      return;
    }
    
    this.showtimeId = showtimeId;
    const draft = this.bookingService.getCurrentBooking();
    
    if (!draft || draft.showtimeId !== showtimeId) {
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

    // Load Razorpay script
    const loaded = await this.razorpayService.loadRazorpayScript();
    this.razorpayLoaded.set(loaded);
    if (!loaded) {
      this.alertService.error('Failed to load payment gateway. Please refresh.');
    }
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

    if (!this.razorpayLoaded()) {
      this.alertService.error('Payment gateway not loaded. Please refresh.');
      return;
    }

    this.processing.set(true);
    const contact = this.contactForm.value;

    // Create Razorpay order
    this.razorpayService.createOrder({
      amount: breakdown.total,
      showtimeId: draft.showtimeId,
      currency: 'INR'
    }).pipe(finalize(() => this.processing.set(false)))
      .subscribe({
        next: (orderResponse) => {
          this.openRazorpayCheckout(orderResponse, draft, breakdown, contact);
        },
        error: (err) => {
          this.alertService.error('Failed to create payment order. Please try again.');
        }
      });
  }

  private openRazorpayCheckout(orderResponse: any, draft: BookingDraft, breakdown: BookingCostBreakdown, contact: any): void {
    const options = {
      key: orderResponse.key,
      amount: orderResponse.amount,
      currency: orderResponse.currency,
      name: 'RevTicket',
      description: `${draft.movieTitle} - ${draft.seatLabels?.join(', ') || draft.seats.join(', ')}`,
      order_id: orderResponse.orderId,
      prefill: {
        name: contact.name,
        email: contact.email,
        contact: contact.phone
      },
      theme: {
        color: '#e50914'
      },
      handler: (response: any) => {
        this.handlePaymentSuccess(response, draft, breakdown, contact);
      },
      modal: {
        ondismiss: () => {
          this.alertService.error('Payment cancelled');
        }
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.on('payment.failed', (response: any) => {
      this.handlePaymentFailure(response, draft, contact);
    });
    razorpay.open();
  }

  private handlePaymentSuccess(response: any, draft: BookingDraft, breakdown: BookingCostBreakdown, contact: any): void {
    this.processing.set(true);

    const verificationRequest = {
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
      razorpaySignature: response.razorpay_signature,
      showtimeId: draft.showtimeId,
      seats: draft.seats,
      seatLabels: draft.seatLabels || draft.seats,
      totalAmount: breakdown.total,
      customerName: contact.name,
      customerEmail: contact.email,
      customerPhone: contact.phone
    };

    this.razorpayService.verifyPayment(verificationRequest)
      .pipe(finalize(() => this.processing.set(false)))
      .subscribe({
        next: (result) => {
          this.bookingService.clearCurrentBooking();
          this.router.navigate(['/user/payment-success'], {
            state: {
              bookingId: result.bookingId,
              ticketNumber: result.ticketNumber,
              draft: draft,
              amount: breakdown.total
            }
          });
        },
        error: (err) => {
          this.alertService.error('Payment verification failed. Please contact support.');
          this.router.navigate(['/user/payment-failure'], {
            state: { draft: draft }
          });
        }
      });
  }

  private handlePaymentFailure(response: any, draft: BookingDraft, contact: any): void {
    this.alertService.error('Payment failed. Please try again.');
    this.router.navigate(['/user/payment-failure'], {
      state: { draft: draft }
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