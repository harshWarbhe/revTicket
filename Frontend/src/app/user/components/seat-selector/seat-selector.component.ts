import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { SeatService } from '../../../core/services/seat.service';
import { Seat, SeatLayout, SeatAvailability } from '../../../core/models/seat.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-seat-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="seat-selector">
      <div class="screen">SCREEN</div>

      <div class="pricing-info">
        <div class="price-category" *ngFor="let category of priceCategories">
          <div class="price-badge" [style.background]="category.color">₹{{ category.price }}</div>
          <span>{{ category.label }}</span>
        </div>
      </div>

      <div class="seat-legend">
        <div class="legend-item">
          <div class="seat available"></div>
          <span>Available</span>
        </div>
        <div class="legend-item">
          <div class="seat selected"></div>
          <span>Selected</span>
        </div>
        <div class="legend-item">
          <div class="seat booked"></div>
          <span>Booked</span>
        </div>
      </div>

      <ng-container *ngIf="!loadingLayout; else seatLoading">
        <div class="seats-container" *ngIf="seatLayout; else emptyState">
          <div class="seat-row" *ngFor="let row of seatLayout.rows; let rowIndex = index">
            <div class="row-label">{{ row }}</div>
            <div class="seats">
              <div
                *ngFor="let seat of getSeatsForRow(row)"
                class="seat"
                [class.available]="isSeatAvailable(seat)"
                [class.selected]="isSelected(seat.id)"
                [class.booked]="seat.isBooked"
                [class.held]="seat.isHeld && !isHeldByMe(seat)"
                [class.price-low]="getSeatPriceCategory(rowIndex) === 'low'"
                [class.price-medium]="getSeatPriceCategory(rowIndex) === 'medium'"
                [class.price-high]="getSeatPriceCategory(rowIndex) === 'high'"
                (click)="toggleSeat(seat, rowIndex)"
                [title]="getSeatTooltip(seat, rowIndex)">
                <span class="seat-number">{{ seat.number }}</span>
                <span class="seat-price" *ngIf="isSeatAvailable(seat)">₹{{ seat.price }}</span>
              </div>
            </div>
          </div>
        </div>
      </ng-container>

      <div class="selection-summary" *ngIf="selectedSeats.length > 0">
        <div class="summary-content">
          <div class="selected-count">{{ selectedSeats.length }} Seat(s) Selected</div>
          <div class="selected-list">{{ getSelectedSeatLabels() }}</div>
          <div class="total-price">Total: ₹{{ calculateTotal() }}</div>
        </div>
        <div class="timer-section" *ngIf="holdExpiry">
          <span class="timer-icon">⏱</span>
          <span class="timer-text">{{ formatTime(timeRemaining) }}</span>
        </div>
      </div>
    </div>

    <ng-template #seatLoading>
      <div class="loading">Loading seat layout...</div>
    </ng-template>

    <ng-template #emptyState>
      <div class="loading">Seat layout unavailable.</div>
    </ng-template>
  `,
  styles: [`
    .seat-selector {
      max-width: 900px;
      margin: 0 auto;
      padding: 30px 20px;
      background: #f8f9fa;
      border-radius: 16px;
      position: relative;
    }
    .screen {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      text-align: center;
      padding: 20px;
      margin: 0 auto 25px;
      border-radius: 50px 50px 0 0;
      width: 70%;
      font-weight: 700;
      letter-spacing: 4px;
      font-size: 16px;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
    .pricing-info {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .price-category {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 600;
    }
    .price-badge {
      padding: 6px 14px;
      border-radius: 20px;
      color: #fff;
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .seat-legend {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 25px;
      margin-bottom: 30px;
      padding: 15px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 500;
      color: #555;
    }
    .legend-item .seat {
      width: 28px;
      height: 28px;
      cursor: default;
    }
    .seats-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
      background: #fff;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 15px rgba(0,0,0,0.08);
    }
    .seat-row {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .row-label {
      width: 30px;
      text-align: center;
      font-weight: 700;
      color: #333;
      font-size: 14px;
    }
    .seats {
      display: flex;
      gap: 8px;
      flex-wrap: nowrap;
    }
    .seat {
      width: 40px;
      height: 45px;
      border: 2px solid #ddd;
      border-radius: 10px 10px 4px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      background: #fff;
    }
    .seat-number {
      font-size: 11px;
      font-weight: 700;
      color: #666;
    }
    .seat-price {
      font-size: 9px;
      font-weight: 600;
      margin-top: 2px;
    }
    .seat.available {
      background: #fff;
      border-color: #28a745;
    }
    .seat.available.price-low {
      border-color: #28a745;
    }
    .seat.available.price-low .seat-price {
      color: #28a745;
    }
    .seat.available.price-medium {
      border-color: #ffc107;
    }
    .seat.available.price-medium .seat-price {
      color: #ffc107;
    }
    .seat.available.price-high {
      border-color: #dc3545;
    }
    .seat.available.price-high .seat-price {
      color: #dc3545;
    }
    .seat.available:hover {
      transform: scale(1.15) translateY(-3px);
      box-shadow: 0 6px 15px rgba(0,0,0,0.2);
      z-index: 10;
    }
    .seat.selected {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border-color: #667eea !important;
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .seat.selected .seat-number,
    .seat.selected .seat-price {
      color: #fff !important;
    }
    .seat.booked,
    .seat.held {
      background: #f5f5f5;
      border-color: #ccc;
      cursor: not-allowed;
      opacity: 0.5;
    }
    .seat.booked .seat-number,
    .seat.held .seat-number {
      color: #999;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
      font-size: 16px;
    }
    .selection-summary {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      padding: 20px;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .summary-content {
      display: flex;
      gap: 25px;
      align-items: center;
      flex-wrap: wrap;
    }
    .selected-count {
      font-size: 18px;
      font-weight: 700;
    }
    .selected-list {
      font-size: 14px;
      opacity: 0.95;
      font-weight: 500;
    }
    .total-price {
      font-size: 22px;
      font-weight: 800;
      padding: 8px 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 25px;
    }
    .timer-section {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.15);
      padding: 10px 18px;
      border-radius: 25px;
      font-weight: 600;
    }
    .timer-icon {
      font-size: 20px;
    }
    .timer-text {
      font-size: 16px;
      font-weight: 700;
    }
  `]
})
export class SeatSelectorComponent implements OnInit, OnDestroy {
  @Input() showtimeId!: string;
  @Output() seatsSelected = new EventEmitter<string[]>();
  @Output() seatLabelsChanged = new EventEmitter<string[]>();
  @Output() totalAmountChanged = new EventEmitter<number>();

  seatLayout: SeatLayout | null = null;
  selectedSeats: string[] = [];
  holdExpiry: Date | null = null;
  timeRemaining = 0;
  loadingLayout = true;
  isProcessingSeat = false;

  private readonly holdDurationMs = 10 * 60 * 1000;
  private readonly sessionId = this.ensureSessionId();
  private holdTimer?: Subscription;
  private availabilityTimer?: Subscription;

  constructor(
    private seatService: SeatService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.loadSeatLayout();
    this.startAvailabilityPolling();
  }

  ngOnDestroy(): void {
    this.holdTimer?.unsubscribe();
    this.availabilityTimer?.unsubscribe();
    this.releaseSelectedSeats(true);
  }

  getSeatsForRow(row: string): Seat[] {
    return this.seatLayout?.seats.filter(seat => seat.row === row) || [];
  }

  isSeatAvailable(seat: Seat): boolean {
    return !seat.isBooked && (!seat.isHeld || this.isHeldByMe(seat));
  }

  isHeldByMe(seat: Seat): boolean {
    return seat.sessionId === this.sessionId;
  }

  priceCategories = [
    { label: 'Regular', price: 150, color: '#28a745' },
    { label: 'Premium', price: 200, color: '#ffc107' },
    { label: 'VIP', price: 300, color: '#dc3545' }
  ];

  getSeatPriceCategory(rowIndex: number): 'low' | 'medium' | 'high' {
    const totalRows = this.seatLayout?.rows.length || 0;
    if (rowIndex < 2) return 'low';
    if (rowIndex < 5) return 'medium';
    return 'high';
  }

  getSeatPrice(rowIndex: number): number {
    const row = this.seatLayout?.rows[rowIndex];
    if (!row) return 150;
    const firstSeat = this.getSeatsForRow(row)[0];
    return firstSeat?.price || 150;
  }

  getSelectedSeatLabels(): string {
    const seatData = this.selectedSeats.map(id => {
      const seat = this.seatLayout?.seats.find(s => s.id === id);
      return seat ? { row: seat.row, number: seat.number, label: `${seat.row}${seat.number}` } : null;
    }).filter(Boolean);
    seatData.sort((a, b) => a!.row.localeCompare(b!.row) || a!.number - b!.number);
    return seatData.map(s => s!.label).join(', ');
  }

  toggleSeat(seat: Seat, rowIndex: number): void {
    if (this.isProcessingSeat) {
      return;
    }

    if (seat.isBooked) {
      this.alertService.warning('This seat is already booked.');
      return;
    }

    if (seat.isHeld && !this.isHeldByMe(seat)) {
      this.alertService.warning('Seat is temporarily held by another user.');
      return;
    }

    const selecting = !this.isSelected(seat.id);
    this.isProcessingSeat = true;

    const action$ = selecting
      ? this.seatService.holdSeats(this.showtimeId, [seat.id], this.sessionId)
      : this.seatService.releaseSeats(this.showtimeId, [seat.id]);

    action$.subscribe({
      next: () => {
        if (selecting) {
          seat.isHeld = true;
          seat.sessionId = this.sessionId;
          this.selectedSeats.push(seat.id);
          this.holdExpiry = new Date(Date.now() + this.holdDurationMs);
          this.startHoldTimer();
        } else {
          seat.isHeld = false;
          seat.sessionId = undefined;
          this.selectedSeats = this.selectedSeats.filter(id => id !== seat.id);
          if (!this.selectedSeats.length) {
            this.holdExpiry = null;
            this.timeRemaining = 0;
          }
        }
        this.emitSelection();
        this.isProcessingSeat = false;
      },
      error: (err) => {
        console.error('Seat toggle error:', err);
        this.alertService.error('Unable to select seat. Please try again.');
        this.isProcessingSeat = false;
        this.loadSeatLayout();
      }
    });
  }

  isSelected(seatId: string): boolean {
    return this.selectedSeats.includes(seatId);
  }

  getSeatTooltip(seat: Seat, rowIndex: number): string {
    if (seat.isBooked) {
      return 'Seat is booked';
    }
    if (seat.isHeld && !this.isHeldByMe(seat)) {
      return 'Seat is temporarily held';
    }
    return `${seat.row}${seat.number} - ₹${seat.price}`;
  }

  extendHold(): void {
    if (!this.selectedSeats.length) {
      return;
    }
    this.seatService.extendSeatHold(this.showtimeId, this.selectedSeats, this.sessionId).subscribe({
      next: () => {
        this.holdExpiry = new Date(Date.now() + this.holdDurationMs);
      },
      error: () => this.alertService.error('Unable to extend hold. Try again shortly.')
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private loadSeatLayout(): void {
    this.loadingLayout = true;
    this.seatService.getSeatLayout(this.showtimeId).subscribe({
      next: layout => {
        this.seatLayout = layout;
        this.loadingLayout = false;
        this.syncSelectedSeats();
      },
      error: () => {
        this.loadingLayout = false;
        this.alertService.error('Failed to load seats. Please refresh.');
      }
    });
  }

  private startAvailabilityPolling(): void {
    this.availabilityTimer = interval(10000).subscribe(() => {
      if (!this.isProcessingSeat) {
        this.seatService.getRealTimeAvailability(this.showtimeId).subscribe({
          next: availability => this.updateSeatAvailability(availability)
        });
      }
    });
  }

  private updateSeatAvailability(availability: SeatAvailability[]): void {
    if (!this.seatLayout) {
      return;
    }
    availability.forEach(avail => {
      const seat = this.seatLayout!.seats.find(s => s.id === avail.seatId);
      if (!seat) {
        return;
      }
      seat.isBooked = avail.isBooked;
      seat.isHeld = avail.isHeld;
      seat.sessionId = avail.heldBySession;
    });
    this.syncSelectedSeats();
  }

  private syncSelectedSeats(): void {
    if (!this.seatLayout) {
      this.selectedSeats = [];
      this.emitSelection();
      return;
    }
    const heldByMe = new Set(
      this.seatLayout.seats
        .filter(seat => seat.sessionId === this.sessionId && seat.isHeld)
        .map(seat => seat.id)
    );
    const previousLength = this.selectedSeats.length;
    this.selectedSeats = this.selectedSeats.filter(id => heldByMe.has(id));
    if (previousLength !== this.selectedSeats.length && !this.selectedSeats.length) {
      this.holdExpiry = null;
      this.timeRemaining = 0;
    }
    this.emitSelection();
  }

  private emitSelection(): void {
    this.seatsSelected.emit([...this.selectedSeats]);
    const seatData = this.selectedSeats.map(id => {
      const seat = this.seatLayout?.seats.find(s => s.id === id);
      return seat ? { row: seat.row, number: seat.number, label: `${seat.row}${seat.number}` } : null;
    }).filter(Boolean);
    seatData.sort((a, b) => a!.row.localeCompare(b!.row) || a!.number - b!.number);
    const labels = seatData.map(s => s!.label);
    this.seatLabelsChanged.emit(labels);
    this.totalAmountChanged.emit(this.calculateTotal());
  }

  calculateTotal(): number {
    return this.selectedSeats.reduce((total, id) => {
      const seat = this.seatLayout?.seats.find(s => s.id === id);
      return total + (seat?.price || 0);
    }, 0);
  }

  private startHoldTimer(): void {
    this.holdTimer?.unsubscribe();
    this.holdTimer = interval(1000).subscribe(() => {
      if (!this.holdExpiry) {
        return;
      }
      this.timeRemaining = Math.max(0, Math.floor((this.holdExpiry.getTime() - Date.now()) / 1000));
      if (this.timeRemaining <= 0) {
        this.alertService.warning('Seat hold expired.');
        this.releaseSelectedSeats();
      }
    });
  }

  private releaseSelectedSeats(skipReload = false): void {
    if (!this.selectedSeats.length) {
      return;
    }
    const seatsToRelease = [...this.selectedSeats];
    this.seatService.releaseSeats(this.showtimeId, seatsToRelease).subscribe({
      next: () => {
        if (!skipReload) {
          this.loadSeatLayout();
        }
      },
      error: () => {
        if (!skipReload) {
          this.alertService.error('Unable to release seats.');
        }
      }
    });
    this.selectedSeats = [];
    this.emitSelection();
    this.holdExpiry = null;
    this.timeRemaining = 0;
  }

  private ensureSessionId(): string {
    const existing = sessionStorage.getItem('seat-session-id');
    if (existing) {
      return existing;
    }
    const generated = `session_${crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
    sessionStorage.setItem('seat-session-id', generated);
    return generated;
  }
}