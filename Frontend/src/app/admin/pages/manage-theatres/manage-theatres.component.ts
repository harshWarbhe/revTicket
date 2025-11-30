import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TheaterService, Theater } from '../../../core/services/theater.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-manage-theatres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './manage-theatres.component.html',
  styleUrls: ['./manage-theatres.component.css']
})
export class ManageTheatresComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private theaterService = inject(TheaterService);
  private alertService = inject(AlertService);
  private destroyRef = inject(DestroyRef);

  theatres = signal<Theater[]>([]);
  filteredTheatres = signal<Theater[]>([]);
  theatreForm: FormGroup;
  
  showForm = signal(false);
  loading = signal(false);
  submitting = signal(false);
  deletingId = signal<string | null>(null);
  statusUpdatingId = signal<string | null>(null);
  editingTheatreId = signal<string | null>(null);
  
  searchTerm = signal('');
  selectedCity = signal('');
  selectedStatus = signal('');
  cities = signal<string[]>([]);
  imagePreview = signal<string>('');

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
          this.theatres.set(theatres);
          this.extractCities(theatres);
          this.applyFilters();
        },
        error: () => {
          this.alertService.error('Failed to load theatres');
        }
      });
  }

  private extractCities(theatres: Theater[]): void {
    const uniqueCities = Array.from(new Set(theatres.map(t => t.location))).sort();
    this.cities.set(uniqueCities as string[]);
  }

  applyFilters(): void {
    const search = this.searchTerm().toLowerCase();
    const city = this.selectedCity();
    const status = this.selectedStatus();

    let filtered = this.theatres();

    if (search) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.location.toLowerCase().includes(search)
      );
    }

    if (city) {
      filtered = filtered.filter(t => t.location === city);
    }

    if (status) {
      const isActive = status === 'active';
      filtered = filtered.filter(t => t.isActive === isActive);
    }

    this.filteredTheatres.set(filtered);
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  addTheatre(): void {
    this.showForm.set(true);
    this.editingTheatreId.set(null);
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
    this.showForm.set(true);
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
      return;
    }

    const payload = this.theatreForm.value;
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
        next: () => {
          this.alertService.success(`Theatre ${editId ? 'updated' : 'created'} successfully`);
          this.closeForm();
          this.loadTheatres();
        },
        error: () => {
          this.alertService.error('Unable to save theatre');
        }
      });
  }

  toggleStatus(theatre: Theater): void {
    this.statusUpdatingId.set(theatre.id);
    this.theaterService.updateTheaterStatus(theatre.id, !theatre.isActive)
      .pipe(
        finalize(() => this.statusUpdatingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (updated) => {
          this.alertService.success(`Theatre ${updated.isActive ? 'activated' : 'deactivated'}`);
          this.theatres.update(theatres => theatres.map(t => t.id === updated.id ? updated : t));
          this.applyFilters();
        },
        error: () => {
          this.alertService.error('Unable to update status');
        }
      });
  }

  deleteTheatre(theatre: Theater): void {
    if (!confirm(`Delete ${theatre.name}? This action cannot be undone.`)) {
      return;
    }

    this.deletingId.set(theatre.id);
    this.theaterService.deleteTheater(theatre.id)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.alertService.success('Theatre deleted successfully');
          this.theatres.update(theatres => theatres.filter(t => t.id !== theatre.id));
          this.applyFilters();
        },
        error: () => {
          this.alertService.error('Unable to delete theatre');
        }
      });
  }

  viewScreens(theatreId: string): void {
    this.router.navigate(['/admin/screens'], { queryParams: { theatreId } });
  }

  cancelForm(): void {
    this.closeForm();
  }

  private closeForm(): void {
    this.showForm.set(false);
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
