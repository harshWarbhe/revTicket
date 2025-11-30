import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface SeatItem {
  type: 'seat' | 'spacer';
  seatNumber?: number;
  rowLabel?: string;
  available?: boolean;
  price?: number;
  seatType?: string;
  seatId?: number;
  isBlocked?: boolean;
}

interface SeatRow {
  row: string;
  items: SeatItem[];
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

  showId!: number;
  show: any;
  
  seats: SeatRow[] = [];
  selectedSeatsMap = new Map<string, {seatNumber: number, price: number, seatId: number}>();
  seatDataMap = new Map<string, any>();
  
  zoomLevel = 1;
  
  isDragging = false;
  startX = 0;
  startY = 0;
  scrollLeft = 0;
  scrollTop = 0;

  get selectedSeats(): string[] {
    return Array.from(this.selectedSeatsMap.keys());
  }

  ngOnInit() {
    window.scrollTo(0, 0);
    this.showId = +this.route.snapshot.queryParamMap.get('showId')!;
    this.loadShow();
  }

  loadShow() {
    this.http.get<any>(`${environment.apiUrl}/shows/${this.showId}`).subscribe({
      next: (response) => {
        this.show = response.data;
        this.loadSeats();
      }
    });
  }

  loadSeats() {
    this.http.get<any>(`${environment.apiUrl}/seats/show/${this.showId}`).subscribe({
      next: (response) => {
        const seatData = response.data || [];
        
        let layout: any = {};
        if (this.show?.screen?.seatLayout) {
          layout = typeof this.show.screen.seatLayout === 'string' 
            ? JSON.parse(this.show.screen.seatLayout) 
            : this.show.screen.seatLayout;
        }
        
        const disabledSeats = new Set(layout.disabledSeats || []);
        const rows = layout.rows || [];
        
        const seatMap = new Map<string, any>();
        seatData.forEach((seat: any) => {
          const position = seat.seatNumber < 0 ? Math.abs(seat.seatNumber) : null;
          if (position) {
            seatMap.set(`${seat.rowLabel}:${position}`, seat);
          } else {
            if (!seatMap.has(`${seat.rowLabel}:bookable`)) {
              seatMap.set(`${seat.rowLabel}:bookable`, []);
            }
            seatMap.get(`${seat.rowLabel}:bookable`)!.push(seat);
          }
        });
        
        this.seats = rows.map((rowLabel: string) => {
          const items: SeatItem[] = [];
          const bookableSeats = seatMap.get(`${rowLabel}:bookable`) || [];
          let bookableIndex = 0;
          
          for (let position = 1; position <= 26; position++) {
            const positionKey = `${rowLabel}${position}`;
            
            if (disabledSeats.has(positionKey)) {
              items.push({ type: 'spacer' });
            } else {
              const seat = bookableSeats[bookableIndex++];
              if (seat) {
                const seatKey = `${seat.rowLabel}${seat.seatNumber}`;
                this.seatDataMap.set(seatKey, seat);
                
                items.push({
                  type: 'seat',
                  seatNumber: seat.seatNumber,
                  rowLabel: seat.rowLabel,
                  available: seat.isAvailable,
                  price: seat.price,
                  seatType: seat.seatType,
                  seatId: seat.seatId,
                  isBlocked: false
                });
              } else {
                items.push({ type: 'spacer' });
              }
            }
          }
          
          return { row: rowLabel, items };
        });
      }
    });
  }

  toggleSeat(rowLabel: string, seatNumber: number) {
    const seatKey = `${rowLabel}${seatNumber}`;
    const seatInfo = this.seatDataMap.get(seatKey);
    
    if (!seatInfo || !seatInfo.isAvailable || seatInfo.isBlocked) return;
    
    if (this.selectedSeatsMap.has(seatKey)) {
      this.selectedSeatsMap.delete(seatKey);
    } else {
      if (this.selectedSeatsMap.size < 10) {
        this.selectedSeatsMap.set(seatKey, {
          seatNumber: seatNumber,
          price: seatInfo.price,
          seatId: seatInfo.seatId
        });
      }
    }
  }

  getSeatClass(rowLabel: string, seatNumber: number, available: boolean): string {
    if (!available) {
      return 'bg-gray-800 border-gray-700 opacity-50 cursor-not-allowed';
    }
    const seatKey = `${rowLabel}${seatNumber}`;
    return this.selectedSeatsMap.has(seatKey)
      ? 'bg-red-600 border-red-500 hover:bg-red-700 cursor-pointer shadow-lg' 
      : 'bg-transparent border-gray-600 hover:border-red-400 hover:bg-red-900/20 cursor-pointer';
  }

  getTotalPrice(): number {
    let total = 0;
    this.selectedSeatsMap.forEach(seatInfo => {
      total += seatInfo.price;
    });
    return total;
  }

  formatShowTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  zoomIn() {
    if (this.zoomLevel < 1.5) this.zoomLevel += 0.1;
  }

  zoomOut() {
    if (this.zoomLevel > 0.5) this.zoomLevel -= 0.1;
  }

  goBack() {
    this.router.navigate(['/movies']);
  }

  onMouseDown(event: MouseEvent, container: HTMLElement) {
    this.isDragging = true;
    this.startX = event.pageX - container.offsetLeft;
    this.startY = event.pageY - container.offsetTop;
    this.scrollLeft = container.scrollLeft;
    this.scrollTop = container.scrollTop;
    container.style.cursor = 'grabbing';
  }

  onMouseMove(event: MouseEvent, container: HTMLElement) {
    if (!this.isDragging) return;
    event.preventDefault();
    const x = event.pageX - container.offsetLeft;
    const y = event.pageY - container.offsetTop;
    const walkX = (x - this.startX) * 1.5;
    const walkY = (y - this.startY) * 1.5;
    container.scrollLeft = this.scrollLeft - walkX;
    container.scrollTop = this.scrollTop - walkY;
  }

  onMouseUp(container: HTMLElement) {
    this.isDragging = false;
    container.style.cursor = 'grab';
  }

  onMouseLeave(container: HTMLElement) {
    if (this.isDragging) {
      this.isDragging = false;
      container.style.cursor = 'grab';
    }
  }

  trackByRow(index: number, row: SeatRow): string {
    return row.row;
  }

  trackByItem(index: number, item: SeatItem): string {
    return item.type === 'seat' ? `${item.rowLabel}${item.seatNumber}` : `spacer-${index}`;
  }

  proceedToPayment() {
    this.router.navigate(['/bookings/payment'], {
      queryParams: {
        showId: this.showId,
        seatNumbers: JSON.stringify(this.selectedSeats),
        totalAmount: this.getTotalPrice()
      }
    });
  }
}
