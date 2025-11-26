import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SeatLayout, SeatAvailability, Seat, SeatType } from '../models/seat.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SeatService {
  constructor(private http: HttpClient) {}

  getSeatLayout(showtimeId: string): Observable<SeatLayout> {
    return this.fetchSeats(showtimeId).pipe(
      switchMap(seats => {
        if (!seats || seats.length === 0) {
          return this.initializeSeatsForShowtime(showtimeId).pipe(
            switchMap(() => this.fetchSeats(showtimeId))
          );
        }
        return of(seats);
      }),
      map(seats => this.buildSeatLayout(showtimeId, seats))
    );
  }

  private fetchSeats(showtimeId: string): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${environment.apiUrl}/seats/showtime/${showtimeId}`);
  }

  private buildSeatLayout(showtimeId: string, seats: Seat[]): SeatLayout {
    if (!seats || seats.length === 0) {
      return {
        showtimeId,
        theater: 'Theater',
        screen: 'Screen 1',
        totalSeats: 0,
        availableSeats: 0,
        seats: [],
        rows: [],
        seatsPerRow: 0
      };
    }

    const rows = [...new Set(seats.map(s => s.row))].sort();
    const seatsPerRow = Math.max(...seats.map(s => s.number));

    return {
      showtimeId,
      theater: 'Theater',
      screen: 'Screen 1',
      totalSeats: seats.length,
      availableSeats: seats.filter(s => !s.isBooked && !s.isHeld).length,
      seats: seats.map(s => ({
        id: s.id,
        row: s.row,
        number: s.number,
        isBooked: s.isBooked,
        isHeld: s.isHeld,
        price: s.price,
        type: s.type as SeatType,
        holdExpiry: s.holdExpiry,
        sessionId: s.sessionId
      })),
      rows,
      seatsPerRow
    };
  }

  holdSeats(showtimeId: string, seatIds: string[], sessionId: string): Observable<void> {
    return this.http.post<any>(`${environment.apiUrl}/seats/hold`, {
      showtimeId,
      seatIds,
      sessionId
    }).pipe(map(() => void 0));
  }

  releaseSeats(showtimeId: string, seatIds: string[]): Observable<void> {
    return this.http.post<any>(`${environment.apiUrl}/seats/release`, {
      showtimeId,
      seatIds
    }).pipe(map(() => void 0));
  }

  getRealTimeAvailability(showtimeId: string): Observable<SeatAvailability[]> {
    return this.http.get<Seat[]>(`${environment.apiUrl}/seats/showtime/${showtimeId}`).pipe(
      map(seats => seats.map(seat => ({
        seatId: seat.id,
        isAvailable: !seat.isBooked && !seat.isHeld,
        isBooked: seat.isBooked,
        isHeld: seat.isHeld,
        heldBySession: seat.sessionId,
        holdExpiry: seat.holdExpiry
      })))
    );
  }

  extendSeatHold(showtimeId: string, seatIds: string[], sessionId: string): Observable<void> {
    return this.holdSeats(showtimeId, seatIds, sessionId);
  }

  initializeSeatsForShowtime(showtimeId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/seats/showtime/${showtimeId}/initialize`, {});
  }
}
