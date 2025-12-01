import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { AlertService } from '../../../core/services/alert.service';

interface Theatre {
  id: string;
  name: string;
  location: string;
  totalScreens: number;
  defaultCategories?: Category[];
}

interface Category {
  id: string;
  name: string;
  price: number;
  color: string;
  inheriting?: boolean;
}

interface SeatData {
  seatId: string;
  label: string;
  row: number;
  col: number;
  categoryId: string | null;
  status: 'available' | 'booked' | 'disabled';
}

interface ScreenConfig {
  id?: string;
  name: string;
  theatreId: string;
  rows: number;
  seatsPerRow: number;
  totalSeats: number;
  categories: Category[];
  seatMap: SeatData[];
}

interface ScreenListItem {
  id: string;
  name: string;
  totalSeats: number;
  theaterId: string;
  isActive: boolean;
}

@Component({
  selector: 'app-screens',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './screens.component.html',
  styleUrls: ['./screens.component.css']
})
export class ScreensComponent implements OnInit {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  theatres = signal<Theatre[]>([]);
  selectedTheatreId = signal<string>('');
  screens = signal<ScreenListItem[]>([]);
  selectedScreenId = signal<string>('');
  screenName = signal<string>('');
  rows = signal<number>(10);
  seatsPerRow = signal<number>(15);
  categories = signal<Category[]>([]);
  seatMap = signal<SeatData[]>([]);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  hasUnsavedChanges = signal<boolean>(false);
  validationErrors = signal<string[]>([]);
  quickAssignCategory = signal<string>('');
  quickAssignFromRow = signal<number>(0);
  quickAssignToRow = signal<number>(0);

  selectedTheatre = computed(() => this.theatres().find(t => t.id === this.selectedTheatreId()));
  totalSeats = computed(() => this.seatMap().filter(s => s.status !== 'disabled').length);

  ngOnInit(): void {
    this.loadTheatres();
  }

  loadTheatres(): void {
    this.loading.set(true);
    this.http.get<Theatre[]>(`${environment.apiUrl}/admin/theatres`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.theatres.set(data); this.loading.set(false); },
      error: () => { this.alertService.error('Failed to load theatres'); this.loading.set(false); }
    });
  }

  onTheatreChange(): void {
    this.selectedScreenId.set('');
    this.screens.set([]);
    this.resetConfiguration();
    if (this.selectedTheatreId()) {
      this.loadScreens();
      this.loadDefaultCategories();
    }
  }

  loadScreens(): void {
    const theatreId = this.selectedTheatreId();
    if (!theatreId) return;
    this.loading.set(true);
    this.http.get<ScreenListItem[]>(`${environment.apiUrl}/admin/theatres/${theatreId}/screens`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.screens.set(data); this.loading.set(false); },
      error: () => { this.alertService.error('Failed to load screens'); this.loading.set(false); }
    });
  }

  loadDefaultCategories(): void {
    const theatre = this.selectedTheatre();
    if (theatre?.defaultCategories?.length) {
      this.categories.set(theatre.defaultCategories.map(c => ({ ...c, inheriting: true })));
    } else {
      this.categories.set([
        { id: this.generateId(), name: 'Premium', price: 250, color: '#8B5CF6' },
        { id: this.generateId(), name: 'Regular', price: 150, color: '#3B82F6' },
        { id: this.generateId(), name: 'Economy', price: 100, color: '#10B981' }
      ]);
    }
  }

  onScreenChange(): void {
    const screenId = this.selectedScreenId();
    if (!screenId) return;
    screenId === 'new' ? this.createNewScreen() : this.loadScreenConfig(screenId);
  }

  createNewScreen(): void {
    this.resetConfiguration();
    this.loadDefaultCategories();
    this.screenName.set(`Screen ${this.screens().length + 1}`);
    this.generateSeatMap();
    this.hasUnsavedChanges.set(true);
  }

  loadScreenConfig(screenId: string): void {
    this.loading.set(true);
    this.http.get<ScreenConfig>(`${environment.apiUrl}/admin/screens/${screenId}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config) => {
        this.screenName.set(config.name);
        this.rows.set(config.rows);
        this.seatsPerRow.set(config.seatsPerRow);
        this.categories.set(config.categories);
        this.seatMap.set(config.seatMap);
        this.hasUnsavedChanges.set(false);
        this.loading.set(false);
      },
      error: () => { this.alertService.error('Failed to load screen configuration'); this.loading.set(false); }
    });
  }

  resetConfiguration(): void {
    this.screenName.set('');
    this.rows.set(10);
    this.seatsPerRow.set(15);
    this.seatMap.set([]);
    this.hasUnsavedChanges.set(false);
    this.validationErrors.set([]);
  }

  onLayoutChange(): void {
    const currentSeats = this.seatMap() || [];
    if (currentSeats.length > 0 && !confirm('Changing layout will reset all seat assignments. Continue?')) return;
    this.generateSeatMap();
    this.hasUnsavedChanges.set(true);
  }

  generateSeatMap(): void {
    const seats: SeatData[] = [];
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.seatsPerRow(); c++) {
        const rowLabel = this.getRowLabel(r);
        seats.push({ 
          seatId: `${rowLabel}${c + 1}`, 
          label: `${rowLabel}${c + 1}`, 
          row: r, 
          col: c, 
          categoryId: null, 
          status: 'available'
        });
      }
    }
    this.seatMap.set(seats);
  }

  getRowLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getRowSeats(row: number): SeatData[] {
    return this.seatMap().filter(s => s.row === row);
  }

  addCategory(): void {
    const newCat: Category = {
      id: this.generateId(),
      name: 'New Category',
      price: 100,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    };
    this.categories.update(cats => [...cats, newCat]);
    this.hasUnsavedChanges.set(true);
  }

  updateCategory(id: string, field: keyof Category, value: any): void {
    const cats = this.categories();
    const cat = cats.find(c => c.id === id);
    if (cat) {
      (cat as any)[field] = value;
      delete cat.inheriting;
      this.categories.set([...cats]);
    }
    if (field === 'price') this.updateSeatPrices(id);
    this.hasUnsavedChanges.set(true);
  }

  deleteCategory(id: string): void {
    if (this.categories().length <= 1) { 
      this.alertService.error('At least one category is required'); 
      return; 
    }
    if (!confirm('Delete this category? Seats assigned to it will be unassigned.')) return;
    this.categories.update(cats => cats.filter(c => c.id !== id));
    this.seatMap.update(seats => seats.map(s => 
      s.categoryId === id ? { ...s, categoryId: null } : s
    ));
    this.hasUnsavedChanges.set(true);
  }

  applyQuickAssign(): void {
    const categoryId = this.quickAssignCategory();
    const fromRow = this.quickAssignFromRow();
    const toRow = this.quickAssignToRow();
    if (!categoryId) { 
      this.alertService.error('Please select a category'); 
      return; 
    }
    if (fromRow > toRow) { 
      this.alertService.error('From row must be less than or equal to To row'); 
      return; 
    }
    const category = this.categories().find(c => c.id === categoryId);
    if (!category) return;
    this.seatMap.update(seats => seats.map(s => 
      (s.row >= fromRow && s.row <= toRow && s.status !== 'booked' && s.status !== 'disabled') 
        ? { ...s, categoryId, status: 'available' } 
        : s
    ));
    this.hasUnsavedChanges.set(true);
    this.alertService.success(`Applied ${category.name} to rows ${this.getRowLabel(fromRow)}-${this.getRowLabel(toRow)}`);
  }

  assignCategory(seat: SeatData, categoryId: string): void {
    if (seat.status === 'booked' || seat.status === 'disabled') return;
    this.seatMap.update(seats => seats.map(s => 
      s.seatId === seat.seatId ? { ...s, categoryId } : s
    ));
    this.hasUnsavedChanges.set(true);
  }

  toggleSeatDisabled(seat: SeatData): void {
    if (seat.status === 'booked') return;
    this.seatMap.update(seats => seats.map(s => 
      s.seatId === seat.seatId 
        ? { ...s, status: s.status === 'disabled' ? 'available' : 'disabled', categoryId: s.status === 'disabled' ? s.categoryId : null } 
        : s
    ));
    this.hasUnsavedChanges.set(true);
  }

  getSeatStyle(seat: SeatData): any {
    if (seat.status === 'booked') return { background: '#6B7280', cursor: 'not-allowed' };
    if (seat.status === 'disabled') return { background: '#EF4444', cursor: 'pointer' };
    if (seat.categoryId) {
      const categories = this.categories();
      if (categories) {
        const cat = categories.find(c => c.id === seat.categoryId);
        return { background: cat?.color || '#E5E7EB', cursor: 'pointer' };
      }
    }
    return { background: '#E5E7EB', cursor: 'pointer' };
  }

  getSeatPrice(seat: SeatData): number {
    const categories = this.categories();
    if (!categories) return 0;
    const cat = categories.find(c => c.id === seat.categoryId);
    return cat?.price || 0;
  }

  getSeatAriaLabel(seat: SeatData): string {
    const categories = this.categories();
    if (!categories) return `Seat ${seat.label}`;
    const cat = categories.find(c => c.id === seat.categoryId);
    const categoryName = cat?.name || 'Unassigned';
    const price = cat?.price || 0;
    return `Seat ${seat.label}, ${categoryName}, Price: ₹${price}, Status: ${seat.status}`;
  }

  updateSeatPrices(categoryId: string): void {
    const cat = this.categories().find(c => c.id === categoryId);
    if (!cat) return;
    this.seatMap.update(seats => seats.map(s => 
      s.categoryId === categoryId ? { ...s } : s
    ));
  }

  validate(): boolean {
    const errors: string[] = [];
    if (!this.selectedTheatreId()) errors.push('Please select a theatre');
    if (!this.screenName().trim()) errors.push('Screen name is required');
    if (this.rows() < 1 || this.rows() > 26) errors.push('Rows must be between 1 and 26');
    if (this.seatsPerRow() < 1 || this.seatsPerRow() > 50) errors.push('Seats per row must be between 1 and 50');
    if (this.categories().length === 0) errors.push('At least one category is required');
    if (this.categories().some(c => !c.name.trim())) errors.push('All categories must have a name');
    if (this.categories().some(c => c.price <= 0)) errors.push('All category prices must be greater than 0');
    if (this.totalSeats() === 0) errors.push('At least one seat must be enabled');
    this.validationErrors.set(errors);
    return errors.length === 0;
  }

  saveScreen(): void {
    if (!this.validate()) { 
      this.alertService.error('Please fix validation errors'); 
      return; 
    }
    this.saving.set(true);
    const config: ScreenConfig = { 
      name: this.screenName(), 
      theatreId: this.selectedTheatreId(), 
      rows: this.rows(), 
      seatsPerRow: this.seatsPerRow(), 
      totalSeats: this.totalSeats(), 
      categories: this.categories().map(c => ({ id: c.id, name: c.name, price: c.price, color: c.color })), 
      seatMap: this.seatMap() 
    };
    const screenId = this.selectedScreenId();
    const request = screenId && screenId !== 'new' 
      ? this.http.put<ScreenConfig>(`${environment.apiUrl}/admin/screens/${screenId}`, config) 
      : this.http.post<ScreenConfig>(`${environment.apiUrl}/admin/screens`, config);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.alertService.success('Screen saved successfully');
        this.hasUnsavedChanges.set(false);
        this.saving.set(false);
        if (response.id && screenId === 'new') {
          this.selectedScreenId.set(response.id);
          this.loadScreens();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.alertService.error(err.error?.message || 'Failed to save screen');
        this.saving.set(false);
      }
    });
  }

  resetToSaved(): void {
    if (!confirm('Discard all unsaved changes?')) return;
    const screenId = this.selectedScreenId();
    if (screenId && screenId !== 'new') {
      this.loadScreenConfig(screenId);
    } else {
      this.createNewScreen();
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
