export interface Seat {
  id: string;
  row: string;
  number: number;
  isBooked: boolean;
  isHeld: boolean;
  price: number;
  type: SeatType;
  holdExpiry?: string;
  sessionId?: string;
}

export interface SeatLayout {
  showtimeId: string;
  theater: string;
  screen: string;
  totalSeats: number;
  availableSeats: number;
  seats: Seat[];
  rows: string[];
  seatsPerRow: number;
}

export enum SeatType {
  REGULAR = 'REGULAR',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP'
}

export interface SeatHold {
  seatIds: string[];
  holdExpiry: Date;
  sessionId: string;
}

export interface SeatAvailability {
  seatId: string;
  isAvailable: boolean;
  isHeld: boolean;
  isBooked: boolean;
  heldBySession?: string;
  holdExpiry?: string;
}