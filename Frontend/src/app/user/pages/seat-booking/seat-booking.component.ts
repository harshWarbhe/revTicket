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
  isDisabled?: boolean;
  isBlocked?: boolean;
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
    const allSeats = this.seats();
    if (allSeats.length === 0) return [];
    
    // Group seats by row
    const seatMap = new Map<string, Seat[]>();
    allSeats.forEach(seat => {
      if (!seatMap.has(seat.row)) {
        seatMap.set(seat.row, []);
      }
      seatMap.get(seat.row)!.push(seat);
    });
    
    // Find max seats per row to create uniform grid
    let maxSeatsInRow = 0;
    seatMap.forEach(seats => {
      const maxNum = Math.max(...seats.map(s => s.number));
      if (maxNum > maxSeatsInRow) maxSeatsInRow = maxNum;
    });
    
    // Create layout with gaps for missing seats (aisles)
    return Array.from(seatMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, seats]) => {
        const sortedSeats = seats.sort((a, b) => a.number - b.number);
        const seatLayout: (Seat | null)[] = [];
        
        for (let i = 1; i <= maxSeatsInRow; i++) {
          const seat = sortedSeats.find(s => s.number === i);
          seatLayout.push(seat || null);
        }
        
        return { row, seats: seatLayout };
      });
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
      .reduce((sum, seat) => sum + seat.price, 0);
  });

  ngOnInit() {
    const showtimeId = this.route.snapshot.paramMap.get('showtimeId');
    
    if (!showtimeId) {
      this.router.navigate(['/user/home']);
      return;
    }
    
    this.showtimeId = showtimeId;
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
        next: async (showtime) => {
          // Load screen info
          if (showtime.screen) {
            try {
              const screen = await this.http.get<Screen>(`${environment.apiUrl}/screens/${showtime.screen}`).toPromise();
              showtime.screenInfo = screen;
            } catch (e) {
              console.error('Failed to load screen info:', e);
            }
          }
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
    // Prevent selection of booked, held, disabled, or blocked seats
    if (seat.isBooked || seat.isHeld || seat.isDisabled || seat.isBlocked) {
      console.log('Seat cannot be selected:', seat);
      return;
    }
    
    const seatKey = `${seat.row}${seat.number}`;
    const selected = new Set(this.selectedSeats());
    
    if (selected.has(seatKey)) {
      selected.delete(seatKey);
      console.log('Seat deselected:', seatKey);
    } else if (selected.size < 10) {
      selected.add(seatKey);
      console.log('Seat selected:', seatKey);
    } else {
      console.log('Maximum 10 seats can be selected');
    }
    
    this.selectedSeats.set(selected);
  }

  getSeatClass(seat: Seat): string {
    // Priority order: disabled > blocked > booked/held > selected > available
    if (seat.isDisabled) return 'disabled';
    if (seat.isBlocked) return 'blocked';
    if (seat.isBooked || seat.isHeld) return 'booked';
    
    const seatKey = `${seat.row}${seat.number}`;
    return this.selectedSeats().has(seatKey) ? 'selected' : 'available';
  }

  isSeatClickable(seat: Seat): boolean {
    return !seat.isBooked && !seat.isHeld && !seat.isDisabled && !seat.isBlocked;
  }

  getSeatTooltip(seat: Seat): string {
    if (seat.isDisabled) return 'This seat is disabled';
    if (seat.isBlocked) return 'This seat is blocked';
    if (seat.isBooked) return 'This seat is already booked';
    if (seat.isHeld) return 'This seat is on hold';
    return `${seat.row}${seat.number} - ₹${seat.price}`;
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
    
    console.log('Navigating to payment:', ['/user/payment', this.showtimeId]);
    this.router.navigate(['/user/payment', this.showtimeId]);
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
    return showtime?.screenInfo?.name || 'Screen 1';
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
}
