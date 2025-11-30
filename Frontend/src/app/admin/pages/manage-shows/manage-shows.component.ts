import { Component, OnInit, signal, inject, DestroyRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { AlertService } from '../../../core/services/alert.service';

interface Movie {
  id: string;
  title: string;
  genre: string[];
  duration: number;
  rating: number;
  posterUrl: string;
}

interface Theater {
  id: string;
  name: string;
  location: string;
  address: string;
  totalScreens: number;
  isActive: boolean;
}

interface Screen {
  id: string;
  name: string;
  totalSeats: number;
  theaterId: string;
  isActive: boolean;
}

interface Showtime {
  id: string;
  movieId: string;
  theaterId: string;
  screen: string;
  showDateTime: string;
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  status: string;
  movie?: {
    id: string;
    title: string;
    posterUrl: string;
  };
  theater?: {
    id: string;
    name: string;
    location: string;
  };
}

interface SeatCategory {
  id: string;
  name: string;
  price: number;
  color: string;
}

interface Seat {
  row: number;
  col: number;
  label: string;
  disabled: boolean;
  categoryId: string | null;
}

@Component({
  selector: 'app-manage-shows',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-shows.component.html',
  styleUrls: ['./manage-shows.component.css']
})
export class ManageShowsComponent implements OnInit {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  shows = signal<Showtime[]>([]);
  movies = signal<Movie[]>([]);
  theaters = signal<Theater[]>([]);
  screens = signal<Screen[]>([]);
  allScreens = signal<Screen[]>([]);
  categories = signal<SeatCategory[]>([
    { id: '1', name: 'Platinum', price: 350, color: '#8B5CF6' },
    { id: '2', name: 'Gold', price: 250, color: '#F59E0B' },
    { id: '3', name: 'Silver', price: 180, color: '#6B7280' }
  ]);
  
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingShowId = signal<string | null>(null);
  
  selectedMovieId = '';
  selectedTheaterId = '';
  selectedScreenId = '';
  showDateTime = '';
  
  rows = signal(10);
  seatsPerRow = signal(15);
  seatLayout = signal<Seat[]>([]);
  
  selectedScreen = computed(() => 
    this.screens().find(s => s.id === this.selectedScreenId)
  );
  
  totalSeats = computed(() => this.rows() * this.seatsPerRow());
  
  availableSeatsCount = computed(() => 
    this.seatLayout().filter(s => !s.disabled).length
  );
  
  categoryCounts = computed(() => {
    const counts = new Map<string, number>();
    this.seatLayout().forEach(seat => {
      if (!seat.disabled && seat.categoryId) {
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

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    // Load movies
    this.http.get<any>(`${environment.apiUrl}/admin/movies`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data || response;
          this.movies.set(Array.isArray(data) ? data : []);
        },
        error: (err) => {
          console.error('Error loading movies:', err);
          this.movies.set([]);
        }
      });
    
    // Load theaters
    this.http.get<Theater[]>(`${environment.apiUrl}/admin/theatres`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.theaters.set(Array.isArray(data) ? data : []);
        },
        error: (err) => {
          console.error('Error loading theaters:', err);
          this.theaters.set([]);
        }
      });
    
    // Load all screens
    this.http.get<Screen[]>(`${environment.apiUrl}/admin/screens`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.allScreens.set(Array.isArray(data) ? data : []);
        },
        error: (err) => {
          console.error('Error loading all screens:', err);
          this.allScreens.set([]);
        }
      });
    
    // Load showtimes
    this.http.get<Showtime[]>(`${environment.apiUrl}/admin/showtimes`)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.shows.set(Array.isArray(data) ? data : []);
        },
        error: (err) => {
          console.error('Error loading showtimes:', err);
          this.shows.set([]);
          this.loading.set(false);
        }
      });
  }

  onTheatreChange(): void {
    this.selectedScreenId = '';
    this.screens.set([]);
    this.seatLayout.set([]);
    
    if (!this.selectedTheaterId) return;
    
    this.http.get<Screen[]>(`${environment.apiUrl}/admin/screens?theatreId=${this.selectedTheaterId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.screens.set(Array.isArray(data) ? data : []);
        },
        error: (err) => {
          console.error('Error loading screens:', err);
          this.screens.set([]);
        }
      });
  }

  onScreenChange(): void {
    const screen = this.selectedScreen();
    if (!screen) return;
    
    // Calculate rows and columns based on total seats
    const totalSeats = screen.totalSeats || 150;
    const calculatedRows = Math.ceil(Math.sqrt(totalSeats / 1.5));
    const calculatedCols = Math.ceil(totalSeats / calculatedRows);
    
    this.rows.set(calculatedRows);
    this.seatsPerRow.set(calculatedCols);
    this.generateSeatLayout();
  }

  generateSeatLayout(): void {
    const seats: Seat[] = [];
    for (let r = 0; r < this.rows(); r++) {
      const rowLabel = String.fromCharCode(65 + r);
      for (let c = 0; c < this.seatsPerRow(); c++) {
        seats.push({
          row: r,
          col: c,
          label: `${rowLabel}${c + 1}`,
          disabled: false,
          categoryId: null
        });
      }
    }
    this.seatLayout.set(seats);
  }

  applyCategoryToRow(rowIndex: number, categoryId: string): void {
    if (!categoryId) return;
    this.seatLayout.update(seats => 
      seats.map(s => s.row === rowIndex ? { ...s, categoryId, disabled: false } : s)
    );
  }

  toggleSeatDisabled(seat: Seat): void {
    this.seatLayout.update(seats => 
      seats.map(s => s.label === seat.label ? { ...s, disabled: !s.disabled, categoryId: s.disabled ? s.categoryId : null } : s)
    );
  }

  getSeatBackground(seat: Seat): string {
    if (seat.disabled) return '#ef4444';
    if (seat.categoryId) {
      const cat = this.categories().find(c => c.id === seat.categoryId);
      return cat?.color || '#e5e7eb';
    }
    return '#e5e7eb';
  }

  getRowLabel(rowIndex: number): string {
    return String.fromCharCode(65 + rowIndex);
  }

  getSeatsForRow(rowIndex: number): Seat[] {
    return this.seatLayout().filter(s => s.row === rowIndex);
  }

  addShow(): void {
    this.editingShowId.set(null);
    this.selectedMovieId = '';
    this.selectedTheaterId = '';
    this.selectedScreenId = '';
    this.showDateTime = '';
    this.seatLayout.set([]);
    this.screens.set([]);
    this.showForm.set(true);
  }

  editShow(show: Showtime): void {
    this.editingShowId.set(show.id);
    this.selectedMovieId = show.movieId;
    this.selectedTheaterId = show.theaterId;
    this.selectedScreenId = show.screen;
    this.showDateTime = new Date(show.showDateTime).toISOString().slice(0, 16);
    
    this.onTheatreChange();
    setTimeout(() => {
      this.onScreenChange();
      this.showForm.set(true);
    }, 300);
  }

  deleteShow(show: Showtime): void {
    const movieTitle = show.movie?.title || 'this show';
    if (!confirm(`Delete show for ${movieTitle}?`)) return;
    
    this.http.delete(`${environment.apiUrl}/admin/showtimes/${show.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertService.success('Show deleted successfully');
          this.loadData();
        },
        error: () => this.alertService.error('Failed to delete show')
      });
  }

  saveShow(): void {
    if (!this.selectedMovieId || !this.selectedTheaterId || !this.selectedScreenId || !this.showDateTime) {
      this.alertService.error('Please fill all required fields');
      return;
    }

    if (this.availableSeatsCount() === 0) {
      this.alertService.error('Please configure seat categories');
      return;
    }

    // Calculate average price from categories
    const categoriesWithSeats = this.categories().filter(cat => 
      (this.categoryCounts().get(cat.id) || 0) > 0
    );
    const avgPrice = categoriesWithSeats.length > 0
      ? categoriesWithSeats.reduce((sum, cat) => sum + cat.price, 0) / categoriesWithSeats.length
      : 200;

    const payload = {
      movieId: this.selectedMovieId,
      theaterId: this.selectedTheaterId,
      screen: this.selectedScreenId,
      showDateTime: this.showDateTime,
      ticketPrice: avgPrice,
      totalSeats: this.availableSeatsCount(),
      availableSeats: this.availableSeatsCount(),
      status: 'ACTIVE'
    };

    this.saving.set(true);
    const editId = this.editingShowId();
    const request$ = editId
      ? this.http.put(`${environment.apiUrl}/admin/showtimes/${editId}`, payload)
      : this.http.post(`${environment.apiUrl}/admin/showtimes`, payload);

    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success(`Show ${editId ? 'updated' : 'created'} successfully`);
          this.cancelForm();
          this.loadData();
        },
        error: (err) => {
          console.error('Save error:', err);
          const errorMsg = err?.error?.message || err?.error?.error || 'Failed to save show';
          this.alertService.error(errorMsg);
        }
      });
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.editingShowId.set(null);
    this.selectedMovieId = '';
    this.selectedTheaterId = '';
    this.selectedScreenId = '';
    this.showDateTime = '';
    this.seatLayout.set([]);
    this.screens.set([]);
  }

  getRowIndices(): number[] {
    return Array.from({ length: this.rows() }, (_, i) => i);
  }

  trackByIndex(index: number): number {
    return index;
  }

  getScreenName(screenId: string): string {
    const screen = this.allScreens().find(s => s.id === screenId);
    return screen?.name || screenId;
  }
}
