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
  seatLabels?: string[];
  totalAmount: number;
  bookingDate: string | Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CANCELLATION_PENDING';
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
  seatLabels?: string[];
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
  seats: string[]; // UUID seat IDs for backend
  seatLabels?: string[]; // Human-readable labels like A1, B2
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
  seats: string[]; // UUID seat IDs
  seatLabels?: string[]; // Human-readable labels
  totalAmount: number;
  movieTitle: string;
  moviePosterUrl?: string;
  theaterName: string;
  theaterLocation?: string;
  screen?: string;
  showtime: string;
}
