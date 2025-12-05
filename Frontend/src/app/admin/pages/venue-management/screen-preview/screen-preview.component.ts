import { Component, Input, Output, EventEmitter, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScreenConfig, SeatData, Category } from '../venue-management.component';
import { VenueService } from '../venue.service';

@Component({
  selector: 'app-screen-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screen-preview.component.html',
  styleUrls: ['./screen-preview.component.css']
})
export class ScreenPreviewComponent implements OnInit {
  @Input() screenId!: string;
  @Output() close = new EventEmitter<void>();

  private venueService = inject(VenueService);

  loading = signal(true);
  config = signal<ScreenConfig | null>(null);

  seatGrid = computed(() => {
    const cfg = this.config();
    if (!cfg) return [];

    const grid: (SeatData | null)[][] = [];
    for (let row = 0; row < cfg.rows; row++) {
      const rowSeats: (SeatData | null)[] = [];
      for (let col = 0; col < cfg.seatsPerRow; col++) {
        const seat = cfg.seatMap.find(s => s.row === row && s.col === col);
        rowSeats.push(seat || null);
      }
      grid.push(rowSeats);
    }
    return grid;
  });

  ngOnInit(): void {
    this.loadPreview();
  }

  private loadPreview(): void {
    this.loading.set(true);
    this.venueService.getScreenConfig(this.screenId).subscribe({
      next: (config) => {
        this.config.set(config);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Load preview error:', err);
        this.loading.set(false);
      }
    });
  }

  getSeatCategory(seat: SeatData | null): Category | undefined {
    if (!seat || !seat.categoryId) return undefined;
    return this.config()?.categories.find(c => c.id === seat.categoryId);
  }

  getRowLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
