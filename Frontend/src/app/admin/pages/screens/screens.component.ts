import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreenService, Screen, CreateScreenDto } from '../../../core/services/screen.service';
import { TheaterService, Theater } from '../../../core/services/theater.service';
import { MovieService } from '../../../core/services/movie.service';
import { Movie } from '../../../core/models/movie.model';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-screens',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './screens.component.html',
  styleUrls: ['./screens.component.css']
})
export class ScreensComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private screenService = inject(ScreenService);
  private theaterService = inject(TheaterService);
  private movieService = inject(MovieService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  screens = signal<Screen[]>([]);
  filteredScreens = signal<Screen[]>([]);
  theatres = signal<Theater[]>([]);
  activeMovies = signal<Movie[]>([]);
  screenForm: FormGroup;
  
  showForm = signal(false);
  loading = signal(false);
  submitting = signal(false);
  deletingId = signal<string | null>(null);
  statusUpdatingId = signal<string | null>(null);
  editingScreenId = signal<string | null>(null);
  
  searchTerm = signal('');
  selectedTheatre = signal('');
  selectedStatus = signal('');

  showAssignModal = signal(false);
  selectedScreen = signal<Screen | null>(null);
  loadingMovies = signal(false);
  assigningMovie = signal(false);
  layoutPreview = signal<string>('');
  // Seat layout builder state
  seatGrid = signal<Array<{ row: number; col: number; disabled?: boolean; type?: 'REGULAR'|'PREMIUM'|'VIP' }>>([]);
  seatRows = signal(1);
  seatCols = signal(1);

  constructor() {
    this.screenForm = this.fb.group({
      screenNumber: ['', [Validators.required]],
      theatreId: ['', [Validators.required]],
      seatingCapacity: [1, [Validators.required, Validators.min(1)]],
      status: ['ACTIVE'],
      rows: [1, [Validators.required, Validators.min(1)]],
      columns: [1, [Validators.required, Validators.min(1)]],
      layoutImageUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadTheatres();
    this.loadScreens();
  }

  loadTheatres(): void {
    this.theaterService.getAdminTheaters(false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (theatres) => this.theatres.set(theatres),
        error: () => this.alertService.error('Failed to load theatres')
      });
  }

  loadScreens(): void {
    this.loading.set(true);
    const theatreId = this.selectedTheatre();
    this.screenService.getScreens(theatreId || undefined)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (screens) => {
          this.screens.set(screens);
          this.applyFilters();
        },
        error: () => this.alertService.error('Failed to load screens')
      });
  }

  applyFilters(): void {
    const search = this.searchTerm().toLowerCase();
    const theatre = this.selectedTheatre();
    const status = this.selectedStatus();

    let filtered = this.screens();

    if (search) {
      filtered = filtered.filter(s =>
        s.screenNumber.toLowerCase().includes(search) ||
        s.theatre.venueName.toLowerCase().includes(search)
      );
    }

    if (theatre) {
      filtered = filtered.filter(s => s.theatre.id === theatre);
    }

    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }

    this.filteredScreens.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  addScreen(): void {
    this.showForm.set(true);
    this.editingScreenId.set(null);
    this.layoutPreview.set('');
    this.screenForm.reset({
      screenNumber: '',
      theatreId: '',
      seatingCapacity: 1,
      status: 'ACTIVE',
      rows: 1,
      columns: 1,
      layoutImageUrl: ''
    });
  }

  editScreen(screen: Screen): void {
    this.showForm.set(true);
    this.editingScreenId.set(screen.id);
    this.layoutPreview.set('');
    this.screenForm.patchValue({
      screenNumber: screen.screenNumber,
      theatreId: screen.theatre.id,
      seatingCapacity: screen.seatingCapacity,
      status: screen.status,
      rows: screen.seatLayout.rows,
      columns: screen.seatLayout.columns,
      layoutImageUrl: ''
    });
  }

  submitScreen(): void {
    this.screenForm.markAllAsTouched();
    if (this.screenForm.invalid) {
      return;
    }

    const formValue = this.screenForm.value;
    // if the admin used the builder, include generated sections
    const sections = this.serializeLayoutSections();

    const payload: CreateScreenDto = {
      screenNumber: formValue.screenNumber,
      theatreId: formValue.theatreId,
      seatingCapacity: formValue.seatingCapacity,
      seatLayout: {
        rows: formValue.rows,
        columns: formValue.columns
      },
      status: formValue.status
    };

    if (sections.length) {
      payload.seatLayoutSections = sections;
    }

    this.submitting.set(true);
    const editId = this.editingScreenId();
    const request$ = editId
      ? this.screenService.updateScreen(editId, payload)
      : this.screenService.createScreen(payload);

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success(`Screen ${editId ? 'updated' : 'created'} successfully`);
          this.closeForm();
          this.loadScreens();
        },
        error: () => this.alertService.error('Unable to save screen')
      });
  }

  assignMovie(screen: Screen): void {
    this.selectedScreen.set(screen);
    this.showAssignModal.set(true);
    this.loadActiveMovies();
  }

  loadActiveMovies(): void {
    this.loadingMovies.set(true);
    this.movieService.getAdminMovies()
      .pipe(
        finalize(() => this.loadingMovies.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (movies) => {
          const activeMovies = movies.filter(m => m.isActive);
          this.activeMovies.set(activeMovies);
        },
        error: () => this.alertService.error('Failed to load movies')
      });
  }

  confirmAssignMovie(movieId: string): void {
    const screen = this.selectedScreen();
    if (!screen) return;

    this.assigningMovie.set(true);
    this.screenService.assignMovie(screen.id, movieId)
      .pipe(
        finalize(() => this.assigningMovie.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success('Movie assigned successfully');
          this.closeAssignModal();
          this.loadScreens();
        },
        error: () => this.alertService.error('Unable to assign movie')
      });
  }

  closeAssignModal(): void {
    this.showAssignModal.set(false);
    this.selectedScreen.set(null);
    this.activeMovies.set([]);
  }

  openLayout(screenId: string): void {
    this.router.navigate(['/admin/screens/layout'], { queryParams: { screenId } });
  }

  toggleStatus(screen: Screen): void {
    const newStatus = screen.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.statusUpdatingId.set(screen.id);
    this.screenService.updateStatus(screen.id, newStatus)
      .pipe(
        finalize(() => this.statusUpdatingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updated) => {
          this.alertService.success(`Screen ${updated.status === 'ACTIVE' ? 'activated' : 'deactivated'}`);
          this.screens.update(screens => screens.map(s => s.id === updated.id ? updated : s));
          this.applyFilters();
        },
        error: () => this.alertService.error('Unable to update status')
      });
  }

  deleteScreen(screen: Screen): void {
    if (!confirm(`Delete ${screen.screenNumber}? This action cannot be undone.`)) {
      return;
    }

    this.deletingId.set(screen.id);
    this.screenService.deleteScreen(screen.id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success('Screen deleted successfully');
          this.screens.update(screens => screens.filter(s => s.id !== screen.id));
          this.applyFilters();
        },
        error: () => this.alertService.error('Unable to delete screen')
      });
  }

  cancelForm(): void {
    this.closeForm();
  }

  private closeForm(): void {
    this.showForm.set(false);
    this.editingScreenId.set(null);
    this.screenForm.reset();
  }

  isInvalid(controlName: string): boolean {
    const control = this.screenForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  trackById(index: number, screen: Screen): string {
    return screen.id;
  }

  previewLayoutFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.layoutPreview.set(result);
      };
      reader.readAsDataURL(file);
    }
  }

  isImage(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(url) || url.startsWith('data:image');
  }

  getTheatreName(theatreId: string): string {
    return this.theatres().find(t => t.id === theatreId)?.name || 'Unknown';
  }

  // -- Seat builder helpers --
  generateGrid(rows: number, cols: number) {
    this.seatRows.set(rows);
    this.seatCols.set(cols);
    const grid: Array<{ row: number; col: number; disabled?: boolean; type?: 'REGULAR'|'PREMIUM'|'VIP' }> = [];
    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        grid.push({ row: r, col: c, disabled: false, type: 'REGULAR' });
      }
    }
    this.seatGrid.set(grid);
  }

  toggleSeatAt(row: number, col: number) {
    this.seatGrid.update(grid => {
      return grid.map(s => s.row === row && s.col === col ? { ...s, disabled: !s.disabled } : s);
    });
  }

  setSeatType(row: number, col: number, type: 'REGULAR'|'PREMIUM'|'VIP') {
    this.seatGrid.update(grid => grid.map(s => s.row === row && s.col === col ? { ...s, type } : s));
  }

  // Convert seatGrid to backend-compatible sections (group by contiguous rows by type)
  serializeLayoutSections(): Array<any> {
    const grid = this.seatGrid();
    if (!grid || !grid.length) return [];
    const rows = this.seatRows();
    const cols = this.seatCols();
    // group rows by type of seats in that row (simple heuristic)
    const sections: Array<any> = [];
    for (let r = 1; r <= rows; r++) {
      const rowSeats = grid.filter(s => s.row === r);
      if (!rowSeats.length) continue;
      const mostCommonType = rowSeats.reduce((acc, s) => {
        const key = (s.type || 'REGULAR') as string;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const type = Object.keys(mostCommonType).sort((a,b) => (mostCommonType[b]||0)-(mostCommonType[a]||0))[0] || 'REGULAR';
      sections.push({
        name: `Section ${r}`,
        rowStart: String(r),
        rowEnd: String(r),
        seatsPerRow: cols,
        price: type === 'VIP' ? 300 : type === 'PREMIUM' ? 200 : 150,
        type
      });
    }
    return sections;
  }
}
