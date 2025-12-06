import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

declare var Razorpay: any;

export interface RazorpayOrderRequest {
  amount: number;
  showtimeId: string;
  currency: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  currency: string;
  amount: number;
  key: string;
}

export interface RazorpayVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  showtimeId: string;
  seats: string[];
  seatLabels: string[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

@Injectable({
  providedIn: 'root'
})
export class RazorpayService {
  private http = inject(HttpClient);

  createOrder(request: RazorpayOrderRequest): Observable<RazorpayOrderResponse> {
    return this.http.post<RazorpayOrderResponse>(`${environment.apiUrl}/razorpay/create-order`, request);
  }

  verifyPayment(request: RazorpayVerificationRequest): Observable<any> {
    return this.http.post(`${environment.apiUrl}/razorpay/verify-payment`, request);
  }

  paymentFailed(request: Partial<RazorpayVerificationRequest>): Observable<any> {
    return this.http.post(`${environment.apiUrl}/razorpay/payment-failed`, request);
  }

  loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof Razorpay !== 'undefined') {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
}
