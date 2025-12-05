import { Component, Input, Output, EventEmitter, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScreenConfig, SeatData, Category } from '../venue-management.component';
import { VenueService } from '../venue.service';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-screen-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './screen-config.component.html',
  styleUrls: ['./screen-config.component.css']
})
export class ScreenConfigComponent implements OnInit {
  @Input() theatreId!: string;
  @Input() screenId!: string;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private venueService = inject(VenueService);
  private alertService = inject(AlertService);

  loading = signal(false);
  saving = signal(false);
  
  screenName = signal('Screen 1');
  rows = signal(10);
  seatsPerRow = signal(15);
  categories = signal<Category[]>([]);
  
  seatMap = signal<SeatData[]>([]);
  selectedCategory = signal<string | null>(null);
  disableMode = signal(false);
  bulkRowRange = '';
  showAddCategory = signal(false);
  newCategoryName = signal('');
  newCategoryPrice = signal(100);
  newCategoryColor = signal('#FF6B6B');
  
  sortedCategories = computed(() => {
    return [...this.categories()].sort((a, b) => a.price - b.price);
  });
  
  seatGrid = computed(() => {
    const r = this.rows();
    const s = this.seatsPerRow();
    const map = this.seatMap();
    
    const grid: (SeatData | null)[][] = [];
    for (let row = 0; row < r; row++) {
      const rowSeats: (SeatData | null)[] = [];
      for (let col = 0; col < s; col++) {
        const seat = map.find(seat => seat.row === row && seat.col === col);
        rowSeats.push(seat || null);
      }
      grid.push(rowSeats);
    }
    return grid;
  });

  ngOnInit(): void {
    if (this.screenId && this.screenId !== 'new') {
      this.loadScreenConfig();
    } else {
      this.initializeNewScreen();
    }
  }



  private loadScreenConfig(): void {
    this.loading.set(true);
    this.venueService.getScreenConfig(this.screenId).subscribe({
      next: (config) => {
        this.screenName.set(config.name);
        this.rows.set(config.rows);
        this.seatsPerRow.set(config.seatsPerRow);
        this.categories.set(config.categories);
        this.seatMap.set(config.seatMap);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Load config error:', err);
        this.alertService.error('Failed to load screen configuration');
        this.loading.set(false);
        this.initializeNewScreen();
      }
    });
  }

  private initializeNewScreen(): void {
    this.screenName.set('Screen 1');
    this.categories.set([]);
    this.generateSeats();
  }

  generateSeats(): void {
    const r = this.rows();
    const s = this.seatsPerRow();
    const seats: SeatData[] = [];
    
    for (let row = 0; row < r; row++) {
      for (let col = 0; col < s; col++) {
        const rowLabel = String.fromCharCode(65 + row);
        seats.push({
          seatId: `${rowLabel}${col + 1}`,
          label: `${rowLabel}${col + 1}`,
          row,
          col,
          categoryId: null,
          status: 'available'
        });
      }
    }
    this.seatMap.set(seats);
  }

  onDimensionChange(): void {
    if (confirm('Changing dimensions will reset the seat layout. Continue?')) {
      this.generateSeats();
    }
  }

  onSeatClick(row: number, col: number): void {
    const catId = this.selectedCategory();
    const isDisableMode = this.disableMode();
    
    this.seatMap.update(seats => {
      const seat = seats.find(s => s.row === row && s.col === col);
      if (seat) {
        if (isDisableMode) {
          // Disable mode: toggle seat status
          seat.status = seat.status === 'disabled' ? 'available' : 'disabled';
        } else if (catId) {
          // Category mode: assign category and enable seat
          seat.categoryId = catId;
          seat.status = 'available';
        }
      }
      return [...seats];
    });
  }

  assignCategoryToRow(rowIndex: number): void {
    const catId = this.selectedCategory();
    const isDisableMode = this.disableMode();
    
    if (!isDisableMode && !catId) {
      this.alertService.error('Please select a category first');
      return;
    }
    
    this.seatMap.update(seats => {
      seats.forEach(seat => {
        if (seat.row === rowIndex) {
          if (isDisableMode) {
            seat.status = seat.status === 'disabled' ? 'available' : 'disabled';
          } else if (catId) {
            seat.categoryId = catId;
            seat.status = 'available';
          }
        }
      });
      return [...seats];
    });
  }

  toggleAddCategory(): void {
    this.showAddCategory.update(v => !v);
    if (this.showAddCategory()) {
      this.newCategoryColor.set(this.getRandomColor());
    } else {
      this.resetCategoryForm();
    }
  }

  resetCategoryForm(): void {
    this.newCategoryName.set('');
    this.newCategoryPrice.set(100);
    this.newCategoryColor.set('#FF6B6B');
  }

  getRandomColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  addCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) {
      this.alertService.error('Category name is required');
      return;
    }
    
    this.categories.update(cats => [
      ...cats,
      { 
        id: Date.now().toString(), 
        name, 
        price: this.newCategoryPrice(), 
        color: this.newCategoryColor() 
      }
    ]);
    
    this.showAddCategory.set(false);
    this.resetCategoryForm();
    this.alertService.success('Category added successfully');
  }

  removeCategory(id: string): void {
    this.categories.update(cats => cats.filter(c => c.id !== id));
    this.alertService.success('Category removed');
  }

  assignCategoryToBulkRows(): void {
    const catId = this.selectedCategory();
    if (!catId) {
      this.alertService.error('Please select a category first');
      return;
    }

    const input = this.bulkRowRange.trim().toUpperCase();
    if (!input) {
      this.alertService.error('Please enter row range (e.g., A-D or A,C,E)');
      return;
    }

    const rowIndices: number[] = [];

    // Parse range (e.g., A-D)
    if (input.includes('-')) {
      const [start, end] = input.split('-');
      const startIdx = start.charCodeAt(0) - 65;
      const endIdx = end.charCodeAt(0) - 65;
      for (let i = startIdx; i <= endIdx; i++) {
        if (i >= 0 && i < this.rows()) rowIndices.push(i);
      }
    }
    // Parse comma-separated (e.g., A,C,E)
    else if (input.includes(',')) {
      input.split(',').forEach(row => {
        const idx = row.trim().charCodeAt(0) - 65;
        if (idx >= 0 && idx < this.rows()) rowIndices.push(idx);
      });
    }
    // Single row
    else {
      const idx = input.charCodeAt(0) - 65;
      if (idx >= 0 && idx < this.rows()) rowIndices.push(idx);
    }

    if (rowIndices.length === 0) {
      this.alertService.error('Invalid row range');
      return;
    }

    this.seatMap.update(seats => {
      seats.forEach(seat => {
        if (rowIndices.includes(seat.row)) {
          seat.categoryId = catId;
          seat.status = 'available';
        }
      });
      return [...seats];
    });

    this.alertService.success(`Category assigned to ${rowIndices.length} row(s)`);
    this.bulkRowRange = '';
  }

  getSeatCategory(seat: SeatData | null): Category | undefined {
    if (!seat || !seat.categoryId) return undefined;
    return this.categories().find(c => c.id === seat.categoryId);
  }

  getRowLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  saveConfiguration(): void {
    if (!this.screenName().trim()) {
      this.alertService.error('Screen name is required');
      return;
    }

    const config: ScreenConfig = {
      name: this.screenName(),
      theatreId: this.theatreId,
      rows: this.rows(),
      seatsPerRow: this.seatsPerRow(),
      totalSeats: this.seatMap().filter(s => s.status !== 'disabled').length,
      categories: this.categories(),
      seatMap: this.seatMap()
    };

    this.saving.set(true);
    const request$ = this.screenId === 'new'
      ? this.venueService.createScreen(config)
      : this.venueService.updateScreenConfig(this.screenId, config);

    request$.subscribe({
      next: () => {
        this.alertService.success('Screen configuration saved successfully');
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err) => {
        console.error('Save error:', err);
        this.alertService.error('Failed to save configuration');
        this.saving.set(false);
      }
    });
  }
}
