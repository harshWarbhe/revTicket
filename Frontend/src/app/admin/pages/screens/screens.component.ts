import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreenService, Screen, CreateScreenDto } from '../../../core/services/screen.service';
import { TheaterService, Theater } from '../../../core/services/theater.service';
import { AlertService } from '../../../core/services/alert.service';

interface SeatCategory {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
}

interface RowRange {
  categoryId: string;
  startRow: number;
  endRow: number;
}

interface Seat {
  row: number;
  col: number;
  label: string;
  disabled: boolean;
  categoryId: string | null;
  blocked: boolean;
}

@Component({
  selector: 'app-screens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './screens.component.html',
  styleUrls: ['./screens.component.css']
})
export class ScreensComponent implements OnInit {
  private screenService = inject(ScreenService);
  private theaterService = inject(TheaterService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  theatres = signal<Theater[]>([]);
  selectedTheatreId = signal<string>('');
  selectedScreenNumber = signal<number>(0);
  
  loading = signal(false);
  saving = signal(false);
  
  currentScreen = signal<Screen | null>(null);
  rows = signal(10);
  seatsPerRow = signal(15);
  seatLayout = signal<Seat[]>([]);
  
  categories = signal<SeatCategory[]>([
    { id: '1', name: 'Platinum', price: 0, color: '#8B5CF6', description: 'Premium recliner seats' },
    { id: '2', name: 'Gold', price: 0, color: '#F59E0B', description: 'Comfortable premium seats' },
    { id: '3', name: 'Silver', price: 0, color: '#6B7280', description: 'Standard seats' }
  ]);
  
  rowRanges = signal<{ categoryId: string; startRow: number; endRow: number }[]>([]);
  showAddCategory = signal(false);
  newCategoryName = '';
  newCategoryPrice = 0;
  newCategoryColor = '#667eea';
  
  selectedTheatre = computed(() => 
    this.theatres().find(t => t.id === this.selectedTheatreId())
  );
  
  availableScreens = computed(() => {
    const theatre = this.selectedTheatre();
    if (!theatre?.totalScreens) return [];
    return Array.from({ length: theatre.totalScreens }, (_, i) => i + 1);
  });
  
  totalSeats = computed(() => this.rows() * this.seatsPerRow());
  
  categoryCounts = computed(() => {
    const counts = new Map<string, number>();
    this.seatLayout().forEach(seat => {
      if (!seat.disabled && !seat.blocked && seat.categoryId) {
        counts.set(seat.categoryId, (counts.get(seat.categoryId) || 0) + 1);
      }
    });
    return counts;
  });
  
  totalRevenue = computed(() => {
    let revenue = 0;
    const counts = this.categoryCounts();
    counts.forEach((count, catId) => {
      const cat = this.categories().find(c => c.id === catId);
      if (cat) revenue += count * cat.price;
    });
    return revenue;
  });
  
  availableSeatsCount = computed(() => 
    this.seatLayout().filter(s => !s.disabled && !s.blocked).length
  );

  ngOnInit(): void {
    this.loadTheatres();
  }

  loadTheatres(): void {
    this.loading.set(true);
    this.theaterService.getAdminTheaters(false)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (theatres) => this.theatres.set(theatres),
        error: () => this.alertService.error('Failed to load theatres')
      });
  }

  onTheatreChange(): void {
    this.selectedScreenNumber.set(0);
    this.currentScreen.set(null);
    this.resetSeatLayout();
  }

  onScreenChange(): void {
    if (!this.selectedScreenNumber()) {
      this.currentScreen.set(null);
      this.resetSeatLayout();
      return;
    }
    this.loadSingleScreen();
  }

  loadSingleScreen(): void {
    const theatreId = this.selectedTheatreId();
    const screenNum = this.selectedScreenNumber();
    
    if (!theatreId || !screenNum) return;

    this.loading.set(true);
    this.screenService.getScreens(theatreId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (screens) => {
          const screen = screens.find(s => 
            s.screenNumber === `Screen ${screenNum}` || 
            s.screenNumber === `${screenNum}` ||
            s.screenNumber.includes(`${screenNum}`)
          );
          
          if (screen) {
            this.currentScreen.set(screen);
            
            // Try to load saved layout from localStorage
            const savedLayout = this.loadLayoutFromLocalStorage(theatreId, screenNum);
            
            if (savedLayout) {
              this.rows.set(savedLayout.rows);
              this.seatsPerRow.set(savedLayout.seatsPerRow);
              this.categories.set(savedLayout.categories);
              this.seatLayout.set(savedLayout.seatLayout);
              this.alertService.success('Loaded saved screen layout');
            } else {
              // Use default layout from screen
              this.rows.set(screen.seatLayout?.rows || 10);
              this.seatsPerRow.set(screen.seatLayout?.columns || 15);
              this.generateSeatLayout();
            }
          } else {
            this.currentScreen.set(null);
            this.resetSeatLayout();
            this.generateSeatLayout();
          }
        },
        error: () => {
          this.alertService.error('Failed to load screen');
          this.resetSeatLayout();
        }
      });
  }

  loadLayoutFromLocalStorage(theatreId: string, screenNum: number): any {
    const layoutKey = `screen_layout_${theatreId}_${screenNum}`;
    
    try {
      const saved = localStorage.getItem(layoutKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load layout from localStorage', e);
    }
    
    return null;
  }

  updateRows(): void {
    this.generateSeatLayout();
  }

  updateSeatsPerRow(): void {
    this.generateSeatLayout();
  }

  generateSeatLayout(): void {
    const seats: Seat[] = [];
    const existing = this.seatLayout();
    
    for (let r = 0; r < this.rows(); r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let c = 0; c < this.seatsPerRow(); c++) {
        const seatLabel = `${rowLabel}${c + 1}`;
        const existingSeat = existing.find(s => s.label === seatLabel);
        
        seats.push({
          row: r,
          col: c,
          label: seatLabel,
          disabled: existingSeat?.disabled || false,
          categoryId: existingSeat?.categoryId || null,
          blocked: existingSeat?.blocked || false
        });
      }
    }
    
    this.seatLayout.set(seats);
  }

  applyToRows(startRow: number, endRow: number, categoryId: string): void {
    this.seatLayout.update(seats => 
      seats.map(s => (s.row >= startRow && s.row <= endRow) 
        ? { ...s, categoryId, disabled: false, blocked: false } 
        : s)
    );
  }

  applyToAll(categoryId: string): void {
    this.seatLayout.update(seats => 
      seats.map(s => ({ ...s, categoryId, disabled: false, blocked: false }))
    );
  }

  clearAll(): void {
    this.seatLayout.update(seats => 
      seats.map(s => ({ ...s, categoryId: null, disabled: false, blocked: false }))
    );
  }

  getSeatStyle(seat: Seat): any {
    if (seat.disabled) return { background: '#EF4444', borderColor: '#DC2626' };
    if (seat.blocked) return { background: '#F59E0B', borderColor: '#D97706' };
    if (seat.categoryId) {
      const cat = this.categories().find(c => c.id === seat.categoryId);
      return cat ? { background: cat.color, borderColor: cat.color } : {};
    }
    return { background: '#E5E7EB', borderColor: '#D1D5DB' };
  }

  getSeatBackground(seat: Seat): string {
    if (seat.disabled) return '#ef4444';
    if (seat.categoryId) {
      const cat = this.categories().find(c => c.id === seat.categoryId);
      return cat?.color || '#e5e7eb';
    }
    return '#e5e7eb';
  }

  addRowRange(): void {
    this.rowRanges.update(ranges => [...ranges, { categoryId: '', startRow: 0, endRow: 0 }]);
  }

  removeRowRange(index: number): void {
    this.rowRanges.update(ranges => ranges.filter((_, i) => i !== index));
  }

  applyRowRanges(): void {
    this.rowRanges().forEach(range => {
      if (range.categoryId && range.startRow <= range.endRow) {
        this.applyToRows(range.startRow, range.endRow, range.categoryId);
      }
    });
  }

  getRowLabel(rowIndex: number): string {
    return String.fromCharCode(65 + rowIndex);
  }

  getSeatsForRow(rowIndex: number): Seat[] {
    return this.seatLayout().filter(s => s.row === rowIndex);
  }



  saveScreen(): void {
    const theatreId = this.selectedTheatreId();
    const screenNum = this.selectedScreenNumber();
    
    if (!theatreId || !screenNum) {
      this.alertService.error('Please select theatre and screen');
      return;
    }

    if (this.availableSeatsCount() === 0) {
      this.alertService.error('Please configure at least one seat category');
      return;
    }

    const payload: CreateScreenDto = {
      screenNumber: `Screen ${screenNum}`,
      theatreId: theatreId,
      seatingCapacity: this.availableSeatsCount(),
      seatLayout: {
        rows: this.rows(),
        columns: this.seatsPerRow()
      },
      status: 'ACTIVE'
    };

    this.saving.set(true);
    const screen = this.currentScreen();
    const request$ = screen
      ? this.screenService.updateScreen(screen.id, payload)
      : this.screenService.createScreen(payload);

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success(`Screen ${screen ? 'updated' : 'created'} successfully`);
          this.saveLayoutToLocalStorage(theatreId, screenNum);
          this.loadSingleScreen();
        },
        error: (err) => {
          console.error('Save error:', err);
          this.alertService.error('Failed to save screen');
        }
      });
  }

  generateLayoutSummary(): string {
    const categories = this.categories();
    const counts = this.categoryCounts();
    let summary = '';
    
    categories.forEach(cat => {
      const count = counts.get(cat.id) || 0;
      if (count > 0) {
        summary += `${cat.name}: ${count} seats @ ₹${cat.price}\n`;
      }
    });
    
    return summary;
  }

  saveLayoutToLocalStorage(theatreId: string, screenNum: number): void {
    const layoutKey = `screen_layout_${theatreId}_${screenNum}`;
    const layoutData = {
      rows: this.rows(),
      seatsPerRow: this.seatsPerRow(),
      categories: this.categories(),
      seatLayout: this.seatLayout(),
      totalSeats: this.availableSeatsCount(),
      totalRevenue: this.totalRevenue(),
      timestamp: new Date().toISOString()
    };
    
    try {
      localStorage.setItem(layoutKey, JSON.stringify(layoutData));
    } catch (e) {
      console.error('Failed to save layout to localStorage', e);
    }
  }

  buildSeatLayoutSections(): any[] {
    const sections: any[] = [];
    const categoryGroups = new Map<string, { rows: Set<number> }>();
    
    this.seatLayout().forEach(seat => {
      if (seat.categoryId && !seat.disabled && !seat.blocked) {
        if (!categoryGroups.has(seat.categoryId)) {
          categoryGroups.set(seat.categoryId, { rows: new Set() });
        }
        categoryGroups.get(seat.categoryId)!.rows.add(seat.row);
      }
    });
    
    categoryGroups.forEach((data, catId) => {
      const cat = this.categories().find(c => c.id === catId);
      if (cat) {
        const rows = Array.from(data.rows).sort((a, b) => a - b);
        sections.push({
          name: cat.name,
          rowStart: String.fromCharCode(65 + rows[0]),
          rowEnd: String.fromCharCode(65 + rows[rows.length - 1]),
          seatsPerRow: this.seatsPerRow(),
          price: cat.price,
          type: cat.name.toUpperCase()
        });
      }
    });
    
    return sections;
  }

  resetSeatLayout(): void {
    this.rows.set(10);
    this.seatsPerRow.set(15);
    this.rowRanges.set([]);
    this.showAddCategory.set(false);
    this.generateSeatLayout();
  }

  getCategoryName(catId: string): string {
    return this.categories().find(c => c.id === catId)?.name || '';
  }

  updateCategoryPrice(catId: string, price: number): void {
    this.categories.update(cats => 
      cats.map(c => c.id === catId ? { ...c, price } : c)
    );
  }

  toggleSeatDisabled(seat: Seat): void {
    this.seatLayout.update(seats => 
      seats.map(s => s.label === seat.label 
        ? { ...s, disabled: !s.disabled, categoryId: s.disabled ? s.categoryId : null } 
        : s)
    );
  }

  addCategory(): void {
    const newCat: SeatCategory = {
      id: Date.now().toString(),
      name: this.newCategoryName,
      price: this.newCategoryPrice,
      color: this.newCategoryColor,
      description: ''
    };
    this.categories.update(cats => [...cats, newCat]);
    this.showAddCategory.set(false);
    this.newCategoryName = '';
    this.newCategoryPrice = 0;
    this.newCategoryColor = '#667eea';
  }

  deleteCategory(catId: string): void {
    if (this.categories().length <= 1) {
      this.alertService.error('At least one category is required');
      return;
    }
    this.categories.update(cats => cats.filter(c => c.id !== catId));
    this.seatLayout.update(seats => 
      seats.map(s => s.categoryId === catId ? { ...s, categoryId: null } : s)
    );
  }
}
