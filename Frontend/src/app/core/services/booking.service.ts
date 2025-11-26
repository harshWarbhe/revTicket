import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Booking,
  BookingConfirmation,
  BookingCostBreakdown,
  BookingDraft,
  BookingRequest
} from '../models/booking.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private bookingDraft: BookingDraft | null = null;
  private bookingConfirmation: BookingConfirmation | null = null;

  constructor(private http: HttpClient) {}

  createBooking(bookingData: BookingRequest): Observable<Booking> {
    return this.http
      .post<Booking>(`${environment.apiUrl}/bookings`, bookingData)
      .pipe(map(booking => this.normalizeBookingDates(booking)));
  }

  getUserBookings(): Observable<Booking[]> {
    return this.http
      .get<Booking[]>(`${environment.apiUrl}/bookings/my-bookings`)
      .pipe(map(bookings => bookings.map(b => this.normalizeBookingDates(b))));
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http
      .get<Booking>(`${environment.apiUrl}/bookings/${id}`)
      .pipe(map(booking => this.normalizeBookingDates(booking)));
  }

  cancelBooking(id: string, reason?: string): Observable<Booking> {
    return this.http
      .post<Booking>(
        `${environment.apiUrl}/bookings/${id}/cancel`,
        reason ? { reason } : {}
      )
      .pipe(map(booking => this.normalizeBookingDates(booking)));
  }

  getAllBookings(): Observable<Booking[]> {
    return this.http
      .get<Booking[]>(`${environment.apiUrl}/bookings/all`)
      .pipe(map(bookings => bookings.map(b => this.normalizeBookingDates(b))));
  }

  setCurrentBooking(draft: BookingDraft): void {
    this.bookingDraft = draft;
  }

  getCurrentBooking(): BookingDraft | null {
    return this.bookingDraft;
  }

  clearCurrentBooking(): void {
    this.bookingDraft = null;
  }

  setLastConfirmedBooking(confirmation: BookingConfirmation): void {
    this.bookingConfirmation = confirmation;
  }

  getLastConfirmedBooking(): BookingConfirmation | null {
    return this.bookingConfirmation;
  }

  clearLastConfirmedBooking(): void {
    this.bookingConfirmation = null;
  }

  calculateCostBreakdown(baseAmount: number): BookingCostBreakdown {
    const convenienceFee = Math.round(baseAmount * 0.05);
    const gst = Math.round((baseAmount + convenienceFee) * 0.18);
    return {
      baseAmount,
      convenienceFee,
      gst,
      total: baseAmount + convenienceFee + gst
    };
  }

  buildConfirmationFromDraft(
    response: Booking,
    draft: BookingDraft,
    totalAmount: number
  ): BookingConfirmation {
    return {
      bookingId: response.id,
      ticketNumber: response.ticketNumber,
      qrCode: response.qrCode,
      seats: response.seats?.length ? response.seats : draft.seats,
      totalAmount,
      movieTitle: draft.movieTitle,
      moviePosterUrl: draft.moviePosterUrl,
      theaterName: draft.theaterName,
      theaterLocation: draft.theaterLocation,
      screen: draft.screen,
      showtime: draft.showDateTime
    };
  }

  normalizeBookingDates(booking: Booking): Booking {
    const normalized: Booking = { ...booking };

    if (typeof normalized.showtime === 'string') {
      normalized.showtime = new Date(normalized.showtime);
    }
    if (typeof normalized.bookingDate === 'string') {
      normalized.bookingDate = new Date(normalized.bookingDate);
    }
    if (normalized.refundDate && typeof normalized.refundDate === 'string') {
      normalized.refundDate = new Date(normalized.refundDate);
    }

    return normalized;
  }
}
