import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BookingService } from '../../../core/services/booking.service';
import { BookingDraft } from '../../../core/models/booking.model';
import { environment } from '../../../../environments/environment';
import { SettingsService } from '../../../core/services/settings.service';

interface Seat {
  id: string;
  row: string;
  number: number;
  price: number;
  type: string;
  isBooked: boolean;
  isHeld: boolean;
  isDisabled: boolean;
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
  readonly settingsService = inject(SettingsService);

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
    
    // Refresh seats every 5 seconds to catch booking/cancellation updates
    setInterval(() => {
      this.loadSeats();
    }, 5000);
  }

  private async loadData() {
    try {
      this.loading.set(true);
      
      // Load showtime first, then seats
      await this.loadShowtime();
      await this.loadSeats();
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

  private async loadSeats(): Promise<void> {
    const showtime = this.showtime();
    if (!showtime?.screen) {
      console.error('No showtime or screen ID available');
      this.seats.set([]);
      return;
    }

    try {
      console.log('Loading screen config for:', showtime.screen);
      // Load screen configuration
      const screenConfig: any = await this.http.get(`${environment.apiUrl}/screens/${showtime.screen}/config`).toPromise();
      
      if (!screenConfig || !screenConfig.seatMap || !screenConfig.categories) {
        console.error('Invalid screen configuration');
        this.seats.set([]);
        return;
      }

      // Load booked seats for this showtime
      const bookedSeats: any[] = await this.http.get<any[]>(`${environment.apiUrl}/seats/showtime/${this.showtimeId}`).toPromise() || [];
      console.log('Booked seats from API:', bookedSeats);
      console.log('Seats marked as booked:', bookedSeats.filter(s => s.isBooked));
      const bookedSeatIds = new Set(bookedSeats.filter(s => s.isBooked === true || s.isBooked === 1).map(s => s.id));

      // Generate seats from screen configuration, excluding disabled seats
      const seats: Seat[] = screenConfig.seatMap
        .filter((seatData: any) => seatData.status !== 'disabled')
        .map((seatData: any) => {
          const category = screenConfig.categories.find((c: any) => c.id === seatData.categoryId);
          const seatLabel = `${String.fromCharCode(65 + seatData.row)}${seatData.col + 1}`;
          // Find matching seat from database
          const dbSeat = bookedSeats.find(bs => bs.row === String.fromCharCode(65 + seatData.row) && bs.number === (seatData.col + 1));
          
          return {
            id: dbSeat?.id || seatLabel,
            row: String.fromCharCode(65 + seatData.row),
            number: seatData.col + 1,
            price: category?.price || showtime.ticketPrice || 100,
            type: category?.name || 'Standard',
            isBooked: bookedSeatIds.has(dbSeat?.id),
            isHeld: false,
            isDisabled: false
          };
        });

      console.log('✅ VENUE-TO-BOOKING TEST:');
      console.log('Screen Config Loaded:', screenConfig.name);
      console.log('Total Seats Generated:', seats.length);
      console.log('Categories:', screenConfig.categories.map((c: any) => `${c.name}: ₹${c.price}`));
      console.log('Sample Seats:', seats.slice(0, 5).map(s => `${s.row}${s.number} (${s.type} - ₹${s.price})`));
      console.log('Disabled Seats:', seats.filter(s => s.isDisabled).length);
      console.log('Booked Seats:', seats.filter(s => s.isBooked).length);

      this.seats.set(seats);
    } catch (error) {
      console.error('Failed to load seats:', error);
      this.seats.set([]);
    }
  }



  toggleSeat(seat: Seat) {
    if (seat.isBooked || seat.isHeld) {
      console.log('Seat cannot be selected:', seat);
      return;
    }
    
    const maxSeats = this.settingsService.maxSeats();
    const seatKey = `${seat.row}${seat.number}`;
    const selected = new Set(this.selectedSeats());
    
    if (selected.has(seatKey)) {
      selected.delete(seatKey);
      console.log('Seat deselected:', seatKey);
    } else if (selected.size < maxSeats) {
      selected.add(seatKey);
      console.log('Seat selected:', seatKey);
    } else {
      console.log(`Maximum ${maxSeats} seats can be selected`);
    }
    
    this.selectedSeats.set(selected);
  }

  getSeatClass(seat: Seat): string {
    if (seat.isBooked || seat.isHeld) return 'booked';
    
    const seatKey = `${seat.row}${seat.number}`;
    return this.selectedSeats().has(seatKey) ? 'selected' : 'available';
  }

  goBack(): void {
    const showtime = this.showtime();
    if (showtime?.movieId) {
      this.router.navigate(['/user/showtimes', showtime.movieId]);
    } else {
      this.router.navigate(['/user/home']);
    }
  }

  getTheaterLabel(): string {
    return this.showtime()?.theater?.name || 'Theater';
  }

  getScreenLabel(): string {
    return this.showtime()?.screenInfo?.name || 'Screen';
  }

  isSeatClickable(seat: Seat): boolean {
    return !seat.isBooked && !seat.isHeld;
  }

  getSeatTooltip(seat: Seat): string {
    if (seat.isBooked) return 'This seat is already booked';
    if (seat.isHeld) return 'This seat is on hold';
    const symbol = this.settingsService.currencySymbol();
    return `${seat.row}${seat.number} - ${symbol}${seat.price}`;
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
    
    console.log('Selected seat IDs being sent:', selectedSeatIds);
    console.log('Selected seat labels:', this.selectedSeatsLabels());
    
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
}
