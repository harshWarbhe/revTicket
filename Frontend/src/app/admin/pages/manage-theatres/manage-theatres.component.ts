import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TheaterService, Theater } from '../../../core/services/theater.service';
import { AlertService } from '../../../core/services/alert.service';
import { environment } from '../../../../environments/environment';

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
  private http = inject(HttpClient);
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
    this.showForm.set(true);
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
    
    console.log('Form Valid:', this.theatreForm.valid);
    console.log('Form Values:', this.theatreForm.value);
    console.log('Form Errors:', this.theatreForm.errors);
    
    if (this.theatreForm.invalid) {
      Object.keys(this.theatreForm.controls).forEach(key => {
        const control = this.theatreForm.get(key);
        if (control?.invalid) {
          console.log(`Invalid field: ${key}`, control.errors);
        }
      });
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

    console.log('Sending payload:', payload);
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
          console.log('Theatre saved successfully:', response);
          this.alertService.success(`Theatre ${editId ? 'updated' : 'created'} successfully`);
          this.closeForm();
          this.loadTheatres();
        },
        error: (err) => {
          console.error('Theatre save error:', err);
          console.error('Error details:', err.error);
          const errorMsg = err?.error?.message || err?.message || 'Unable to save theatre. Please check console for details.';
          this.alertService.error(errorMsg);
        }
      });
  }

  toggleStatus(id: string, currentStatus: boolean): void {
    const theatre = this.theatres().find(t => t.id === id);
    const theatreName = theatre?.name || 'Theatre';
    
    this.statusUpdatingId.set(id);
    const endpoint = currentStatus ? 'pause' : 'resume';
    
    this.http.put<any>(`${environment.apiUrl}/admin/theatres/${id}/${endpoint}`, {})
      .pipe(
        finalize(() => this.statusUpdatingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
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

  goToScreens(id: string): void {
    this.router.navigate(['/admin/screens'], { queryParams: { theatreId: id } });
  }

  editTheatreById(id: string): void {
    this.router.navigate(['/admin/manage-theatres/edit', id]);
  }

  deleteTheatreById(id: string): void {
    const theatre = this.theatres().find(t => t.id === id);
    const theatreName = theatre?.name || 'this theatre';
    
    if (!confirm(`Delete "${theatreName}"?\n\nThis action cannot be undone and will remove all associated screens.`)) return;
    
    this.deletingId.set(id);
    this.http.delete(`${environment.apiUrl}/admin/theatres/${id}`)
      .pipe(
        finalize(() => this.deletingId.set(null)),
        takeUntilDestroyed(this.destroyRef)
      )
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
