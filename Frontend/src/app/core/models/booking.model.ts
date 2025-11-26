export interface Booking {
  id: string;
  userId: string;
  movieId: string;
  movieTitle: string;
  moviePosterUrl?: string;
  theaterId: string;
  theaterName: string;
  theaterLocation?: string;
  showtimeId: string;
  showtime: string | Date;
  screen?: string;
  ticketPrice?: number;
  seats: string[];
  totalAmount: number;
  bookingDate: string | Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentId?: string;
  qrCode?: string;
  ticketNumber?: string;
  refundAmount?: number;
  refundDate?: string | Date;
  cancellationReason?: string;
}

export interface BookingRequest {
  movieId: string;
  theaterId: string;
  showtimeId: string;
  showtime: Date;
  seats: string[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  paymentMethod: 'CARD' | 'UPI' | 'WALLET';
}

export interface BookingDraft {
  showtimeId: string;
  showDateTime: string;
  movieId: string;
  movieTitle: string;
  moviePosterUrl?: string;
  theaterId: string;
  theaterName: string;
  theaterLocation?: string;
  screen?: string;
  seats: string[];
  totalAmount: number;
}

export interface BookingCostBreakdown {
  baseAmount: number;
  convenienceFee: number;
  gst: number;
  total: number;
}

export interface BookingConfirmation {
  bookingId: string;
  ticketNumber?: string;
  qrCode?: string;
  seats: string[];
  totalAmount: number;
  movieTitle: string;
  moviePosterUrl?: string;
  theaterName: string;
  theaterLocation?: string;
  screen?: string;
  showtime: string;
}
