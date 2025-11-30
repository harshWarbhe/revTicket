import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookingService } from '../../../core/services/booking.service';
import { BookingDraft } from '../../../core/models/booking.model';
import { environment } from '../../../../environments/environment';

interface Seat {
  id: string;
  row: string;
  number: number;
  price: number;
  type: string;
  isBooked: boolean;
  isHeld: boolean;
}

interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  screen: string;
  showDateTime: string;
  ticketPrice: number;
  movie?: { title: string; posterUrl: string };
  theater?: { name: string; location: string };
  screenInfo?: { id: string; name: string; totalSeats: number };
}

interface Screen {
  id: string;
  name: string;
  totalSeats: number;
  theaterId: string;
}

@Component({
  selector: 'app-seat-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-booking.component.html',
  styleUrls: ['./seat-booking.component.css']
})
export class SeatBookingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private bookingService = inject(BookingService);

  showtime = signal<Showtime | null>(null);
  seats = signal<Seat[]>([]);
  selectedSeats = signal<Set<string>>(new Set());
  loading = signal(true);
  error = signal('');

  showtimeId = '';

  seatRows = computed(() => {
    const seatMap = new Map<string, Seat[]>();
    this.seats().forEach(seat => {
      if (!seatMap.has(seat.row)) {
        seatMap.set(seat.row, []);
      }
      seatMap.get(seat.row)!.push(seat);
    });
    
    return Array.from(seatMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, seats]) => ({
        row,
        seats: seats.sort((a, b) => a.number - b.number)
      }));
  });

  selectedSeatsList = computed(() => Array.from(this.selectedSeats()));
  
  selectedSeatsLabels = computed(() => {
    const selected = this.selectedSeats();
    return this.seats()
      .filter(seat => selected.has(`${seat.row}${seat.number}`))
      .map(seat => `${seat.row}${seat.number}`)
      .sort();
  });
  
  totalPrice = computed(() => {
    const selected = this.selectedSeats();
    return this.seats()
      .filter(seat => selected.has(`${seat.row}${seat.number}`))
      .reduce((total, seat) => total + seat.price, 0);
  });

  ngOnInit() {
    const movieSlug = this.route.snapshot.paramMap.get('movieSlug');
    const showtimeSlug = this.route.snapshot.paramMap.get('showtimeSlug');
    
    if (!movieSlug || !showtimeSlug) {
      this.router.navigate(['/user/home']);
      return;
    }
    
    // Extract showtime ID from slug (format: theater-name-date-time-uuid)
    // UUID is the last 36 characters (8-4-4-4-12 format)
    if (showtimeSlug.length >= 36) {
      this.showtimeId = showtimeSlug.slice(-36); // Get last 36 chars (full UUID)
    } else {
      this.router.navigate(['/user/home']);
      return;
    }
    
    this.loadData();
  }

  private async loadData() {
    try {
      this.loading.set(true);
      
      await Promise.all([
        this.loadShowtime(),
        this.loadSeats()
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
      this.error.set(`Failed to load booking data: ${error}`);
    } finally {
      this.loading.set(false);
    }
  }

  private loadShowtime(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<Showtime>(`${environment.apiUrl}/showtimes/${this.showtimeId}`).subscribe({
        next: (showtime) => {
          this.showtime.set(showtime);
          resolve();
        },
        error: (error) => {
          console.error('Error loading showtime:', error);
          reject(error);
        }
      });
    });
  }

  private loadSeats(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<Seat[]>(`${environment.apiUrl}/seats/showtime/${this.showtimeId}`).subscribe({
        next: (seats) => {
          this.seats.set(seats);
          resolve();
        },
        error: () => {
          this.seats.set([]);
          resolve();
        }
      });
    });
  }



  toggleSeat(seat: Seat) {
    if (seat.isBooked || seat.isHeld) return;
    
    const seatKey = `${seat.row}${seat.number}`;
    const selected = new Set(this.selectedSeats());
    
    if (selected.has(seatKey)) {
      selected.delete(seatKey);
    } else if (selected.size < 10) {
      selected.add(seatKey);
    }
    
    this.selectedSeats.set(selected);
  }

  getSeatClass(seat: Seat): string {
    if (seat.isBooked || seat.isHeld) return 'booked';
    const seatKey = `${seat.row}${seat.number}`;
    return this.selectedSeats().has(seatKey) ? 'selected' : 'available';
  }

  proceedToPayment() {
    if (this.selectedSeatsList().length === 0) return;
    
    const showtime = this.showtime();
    if (!showtime) return;
    
    const selectedSeatIds: string[] = [];
    const selected = this.selectedSeats();
    
    this.seats().forEach(seat => {
      const seatKey = `${seat.row}${seat.number}`;
      if (selected.has(seatKey)) {
        selectedSeatIds.push(seat.id);
      }
    });
    
    const bookingDraft: BookingDraft = {
      movieId: showtime.movieId,
      theaterId: showtime.theaterId,
      showtimeId: this.showtimeId,
      showDateTime: showtime.showDateTime,
      seats: selectedSeatIds,
      seatLabels: this.selectedSeatsLabels(),
      totalAmount: this.totalPrice(),
      movieTitle: showtime.movie?.title || 'Movie',
      moviePosterUrl: showtime.movie?.posterUrl || '',
      theaterName: showtime.theater?.name || 'Theater',
      theaterLocation: showtime.theater?.location || '',
      screen: this.getScreenLabel()
    };
    
    console.log('Setting booking draft:', bookingDraft);
    this.bookingService.setCurrentBooking(bookingDraft);
    
    const movieSlug = this.createSlug(showtime.movie?.title || 'movie');
    const showtimeSlug = this.createShowtimeSlug(showtime);
    
    console.log('Navigating to payment:', ['/user/payment', movieSlug, showtimeSlug]);
    this.router.navigate(['/user/payment', movieSlug, showtimeSlug]);
  }

  goBack() {
    this.router.navigate(['/user/home']);
  }
  
  getTheaterLabel(): string {
    const showtime = this.showtime();
    return showtime?.theater?.name || 'Theater';
  }
  
  getScreenLabel(): string {
    const showtime = this.showtime();
    return showtime?.screen || 'Screen';
  }
  
  getShowLabel(): string {
    const showtime = this.showtime();
    if (showtime?.showDateTime) {
      const date = new Date(showtime.showDateTime);
      const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${timeStr}`;
    }
    return 'Show';
  }
  
  getMovieLabel(): string {
    const showtime = this.showtime();
    return showtime?.movie?.title || 'Movie';
  }
  
  private createSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  private createShowtimeSlug(showtime: Showtime): string {
    const theaterSlug = (showtime.theater?.name || 'theater').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const date = new Date(showtime.showDateTime);
    const timeStr = date.toTimeString().slice(0, 5).replace(':', '');
    const dateStr = date.toISOString().slice(0, 10);
    return `${theaterSlug}-${dateStr}-${timeStr}-${showtime.id}`;
  }
}
