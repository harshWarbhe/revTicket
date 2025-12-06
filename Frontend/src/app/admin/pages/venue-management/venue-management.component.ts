import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TheaterService, Theater } from '../../../core/services/theater.service';
import { AlertService } from '../../../core/services/alert.service';
import { LocationService } from '../../../core/services/location.service';
import { environment } from '../../../../environments/environment';
import { TheatreItemComponent } from './theatre-item/theatre-item.component';
import { ScreenConfigComponent } from './screen-config/screen-config.component';
import { ScreenPreviewComponent } from './screen-preview/screen-preview.component';
import { VenueService } from './venue.service';

export interface Category {
  id: string;
  name: string;
  price: number;
  color: string;
  inheriting?: boolean;
}

export interface SeatData {
  seatId: string;
  label: string;
  row: number;
  col: number;
  categoryId: string | null;
  status: 'available' | 'booked' | 'disabled';
}

export interface ScreenConfig {
  id?: string;
  name: string;
  theatreId: string;
  rows: number;
  seatsPerRow: number;
  totalSeats: number;
  categories: Category[];
  seatMap: SeatData[];
}

export interface ScreenListItem {
  id: string;
  name: string;
  totalSeats: number;
  theaterId: string;
  isActive: boolean;
}

@Component({
  selector: 'app-venue-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TheatreItemComponent, ScreenConfigComponent, ScreenPreviewComponent],
  templateUrl: './venue-management.component.html',
  styleUrls: ['./venue-management.component.css']
})
export class VenueManagementComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private theaterService = inject(TheaterService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);
  private venueService = inject(VenueService);
  readonly locationService = inject(LocationService);

  // Theatre management
  theatres = signal<Theater[]>([]);
  filteredTheatres = signal<Theater[]>([]);
  theatreForm: FormGroup;
  
  // UI state
  showTheatreForm = signal(false);
  loading = signal(false);
  submitting = signal(false);
  editingTheatreId = signal<string | null>(null);
  expandedTheatreId = signal<string | null>(null);
  configTheatreId = signal<string | null>(null);
  configScreenId = signal<string | null>(null);
  previewScreenId = signal<string | null>(null);
  
  // Filters
  searchTerm = signal('');
  selectedCity = signal('');
  selectedStatus = signal('');
  cities = signal<string[]>([]);
  imagePreview = signal<string>('');

  // Screen data
  screens = signal<Record<string, ScreenListItem[]>>({});

  constructor() {
    this.theatreForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      location: ['', [Validators.required, Validators.maxLength(120)]],
      address: ['', [Validators.required, Validators.maxLength(400)]],
      totalScreens: [1, [Validators.required, Validators.min(1)]],
      imageUrl: ['', [Validators.maxLength(500)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadTheatres();
    this.handleRouteParams();
  }

  private handleRouteParams(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['theatreId']) {
        this.expandedTheatreId.set(params['theatreId']);
        this.loadScreens(params['theatreId']);
        
        if (params['screenId']) {
          if (params['preview'] === 'true') {
            this.previewScreenId.set(params['screenId']);
          } else {
            this.configTheatreId.set(params['theatreId']);
            this.configScreenId.set(params['screenId']);
          }
        }
      }
    });
  }

  loadTheatres(): void {
    this.loading.set(true);
    this.theaterService.getAdminTheaters(false)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (theatres) => {
          const sorted = (theatres || []).sort((a, b) => b.id.localeCompare(a.id));
          this.theatres.set(sorted);
          this.extractCities(sorted);
          this.applyFilters();
        },
        error: (err) => {
          console.error('Load theatres error:', err);
          this.alertService.error('Failed to load theatres. Please try again.');
          this.theatres.set([]);
          this.filteredTheatres.set([]);
        }
      });
  }

  private extractCities(theatres: Theater[]): void {
    const uniqueCities = Array.from(new Set(theatres.map(t => t.location))).sort();
    this.cities.set(uniqueCities as string[]);
  }

  applyFilters(): void {
    const search = this.searchTerm().toLowerCase().trim();
    const city = this.selectedCity();
    const status = this.selectedStatus();

    let filtered = this.theatres();

    if (search) {
      filtered = filtered.filter(t =>
        t.name?.toLowerCase().includes(search) ||
        t.location?.toLowerCase().includes(search) ||
        t.address?.toLowerCase().includes(search)
      );
    }

    if (city) {
      filtered = filtered.filter(t => t.location === city);
    }

    if (status) {
      const isActive = status === 'active';
      filtered = filtered.filter(t => t.isActive === isActive);
    }

    this.filteredTheatres.set(filtered.sort((a, b) => a.name.localeCompare(b.name)));
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  addTheatre(): void {
    this.showTheatreForm.set(true);
    this.editingTheatreId.set(null);
    this.imagePreview.set('');
    this.theatreForm.reset({
      name: '',
      location: '',
      address: '',
      totalScreens: 1,
      imageUrl: '',
      isActive: true
    });
  }

  editTheatre(theatre: Theater): void {
    this.showTheatreForm.set(true);
    this.editingTheatreId.set(theatre.id);
    this.theatreForm.patchValue({
      name: theatre.name,
      location: theatre.location,
      address: theatre.address,
      totalScreens: theatre.totalScreens ?? 1,
      imageUrl: theatre.imageUrl ?? '',
      isActive: theatre.isActive
    });
    if (theatre.imageUrl) this.imagePreview.set(theatre.imageUrl);
  }

  submitTheatre(): void {
    this.theatreForm.markAllAsTouched();
    
    if (this.theatreForm.invalid) {
      this.alertService.error('Please fill all required fields correctly');
      return;
    }

    const formValue = this.theatreForm.value;
    const payload: any = {
      name: formValue.name,
      location: formValue.location,
      address: formValue.address,
      totalScreens: formValue.totalScreens,
      isActive: formValue.isActive
    };
    
    if (formValue.imageUrl) {
      payload.imageUrl = formValue.imageUrl;
    }

    this.submitting.set(true);

    const editId = this.editingTheatreId();
    const request$ = editId
      ? this.theaterService.updateTheater(editId, payload)
      : this.theaterService.createTheater(payload);

    request$
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          this.alertService.success(`Theatre ${editId ? 'updated' : 'created'} successfully`);
          this.closeTheatreForm();
          this.loadTheatres();
        },
        error: (err) => {
          console.error('Theatre save error:', err);
          const errorMsg = err?.error?.message || err?.message || 'Unable to save theatre. Please check console for details.';
          this.alertService.error(errorMsg);
        }
      });
  }

  toggleTheatreStatus(id: string, currentStatus: boolean): void {
    const theatre = this.theatres().find(t => t.id === id);
    const theatreName = theatre?.name || 'Theatre';
    
    const endpoint = currentStatus ? 'pause' : 'resume';
    
    this.http.put<any>(`${environment.apiUrl}/admin/theatres/${id}/${endpoint}`, {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const action = !currentStatus ? 'activated' : 'deactivated';
          this.alertService.success(`"${theatreName}" ${action} successfully`);
          this.theatres.update(theatres => theatres.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
          this.applyFilters();
        },
        error: (err) => {
          console.error('Status update error:', err);
          this.alertService.error('Unable to update theatre status');
        }
      });
  }

  deleteTheatre(id: string): void {
    const theatre = this.theatres().find(t => t.id === id);
    const theatreName = theatre?.name || 'this theatre';
    
    if (!confirm(`Delete "${theatreName}"?\n\nThis action cannot be undone and will remove all associated screens.`)) return;
    
    this.http.delete(`${environment.apiUrl}/admin/theatres/${id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertService.success(`"${theatreName}" deleted successfully`);
          this.theatres.update(theatres => theatres.filter(t => t.id !== id));
          this.applyFilters();
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.alertService.error('Unable to delete theatre. It may have active screens or shows.');
        }
      });
  }

  toggleScreens(theatreId: string): void {
    if (this.expandedTheatreId() === theatreId) {
      this.expandedTheatreId.set(null);
    } else {
      this.expandedTheatreId.set(theatreId);
      this.loadScreens(theatreId);
    }
  }

  loadScreens(theatreId: string): void {
    this.venueService.getScreensByTheatre(theatreId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.screens.update(s => ({ ...s, [theatreId]: data }));
        },
        error: () => {
          this.alertService.error('Failed to load screens');
        }
      });
  }

  openScreenConfig(theatreId: string, screenId: string): void {
    this.configTheatreId.set(theatreId);
    this.configScreenId.set(screenId);
    this.router.navigate(['/admin/venues'], { 
      queryParams: { 
        theatreId: theatreId,
        screenId: screenId 
      } 
    });
  }

  previewScreen(theatreId: string, screenId: string): void {
    this.previewScreenId.set(screenId);
    this.router.navigate(['/admin/venues'], { 
      queryParams: { 
        theatreId: theatreId,
        screenId: screenId,
        preview: 'true'
      } 
    });
  }

  closeScreenConfig(): void {
    this.configTheatreId.set(null);
    this.configScreenId.set(null);
    const theatreId = this.expandedTheatreId();
    if (theatreId) {
      this.loadScreens(theatreId);
      this.router.navigate(['/admin/venues'], { queryParams: { theatreId } });
    } else {
      this.router.navigate(['/admin/venues']);
    }
  }

  closePreview(): void {
    this.previewScreenId.set(null);
    const theatreId = this.expandedTheatreId();
    if (theatreId) {
      this.router.navigate(['/admin/venues'], { queryParams: { theatreId } });
    } else {
      this.router.navigate(['/admin/venues']);
    }
  }

  onConfigSaved(): void {
    this.closeScreenConfig();
  }

  cancelTheatreForm(): void {
    this.closeTheatreForm();
  }

  private closeTheatreForm(): void {
    this.showTheatreForm.set(false);
    this.editingTheatreId.set(null);
    this.theatreForm.reset();
  }

  isInvalid(controlName: string): boolean {
    const control = this.theatreForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  trackByTheatreId(index: number, theatre: Theater): string {
    return theatre.id;
  }

  previewFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.imagePreview.set(result);
      };
      reader.readAsDataURL(file);
    }
  }

  isImage(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(url) || url.startsWith('data:image');
  }
}