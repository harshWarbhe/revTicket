import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TheaterService, Theater } from '../../../core/services/theater.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-manage-theatres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-theatres.component.html',
  styleUrls: ['./manage-theatres.component.css']
})
export class ManageTheatresComponent implements OnInit {
  theatres: Theater[] = [];
  theatreForm: FormGroup;
  showForm = false;
  loading = false;
  submitting = false;
  deletingId: string | null = null;
  statusUpdatingId: string | null = null;
  editingTheatreId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private theaterService: TheaterService,
    private alertService: AlertService
  ) {
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
    this.loading = true;
    this.theaterService.getAllTheaters(false)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (theatres) => this.theatres = theatres,
        error: (err) => {
          console.error('Failed to load theatres', err);
          this.alertService.error('Failed to load theaters. Please try again.');
        }
      });
  }

  addTheatre(): void {
    this.showForm = true;
    this.editingTheatreId = null;
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
    this.showForm = true;
    this.editingTheatreId = theatre.id;
    this.theatreForm.patchValue({
      name: theatre.name,
      location: theatre.location,
      address: theatre.address,
      totalScreens: theatre.totalScreens ?? 1,
      imageUrl: theatre.imageUrl ?? '',
      isActive: theatre.isActive
    });
  }

  submitTheatre(): void {
    this.theatreForm.markAllAsTouched();
    if (this.theatreForm.invalid) {
      return;
    }

    const payload = this.theatreForm.value;
    this.submitting = true;

    const request$ = this.editingTheatreId
      ? this.theaterService.updateTheater(this.editingTheatreId, payload)
      : this.theaterService.createTheater(payload);

    request$
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: () => {
          this.alertService.success(`Theater ${this.editingTheatreId ? 'updated' : 'created'} successfully`);
          this.closeForm();
          this.loadTheatres();
        },
        error: (err) => {
          console.error('Failed to save theater', err);
          this.alertService.error('Unable to save theater. Please check the details and try again.');
        }
      });
  }

  toggleStatus(theatre: Theater): void {
    this.statusUpdatingId = theatre.id;
    this.theaterService.updateTheaterStatus(theatre.id, !theatre.isActive)
      .pipe(finalize(() => this.statusUpdatingId = null))
      .subscribe({
        next: (updated) => {
          this.alertService.success(`Theater ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
          this.theatres = this.theatres.map(t => t.id === updated.id ? updated : t);
        },
        error: (err) => {
          console.error('Failed to update status', err);
          this.alertService.error('Unable to update status. Please try again.');
        }
      });
  }

  deleteTheatre(theatre: Theater): void {
    if (!confirm(`Delete ${theatre.name}? This action cannot be undone.`)) {
      return;
    }

    this.deletingId = theatre.id;
    this.theaterService.deleteTheater(theatre.id)
      .pipe(finalize(() => this.deletingId = null))
      .subscribe({
        next: () => {
          this.alertService.success('Theater deleted successfully');
          this.theatres = this.theatres.filter(t => t.id !== theatre.id);
        },
        error: (err) => {
          console.error('Failed to delete theater', err);
          this.alertService.error('Unable to delete theater. Please try again.');
        }
      });
  }

  cancelForm(): void {
    this.closeForm();
  }

  private closeForm(): void {
    this.showForm = false;
    this.editingTheatreId = null;
    this.theatreForm.reset();
  }

  isInvalid(controlName: string): boolean {
    const control = this.theatreForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  trackByTheatreId(index: number, theatre: Theater): string {
    return theatre.id;
  }

  onImageError(event: Event, theatre: Theater): void {
    const img = event.target as HTMLImageElement;
    img.src = `https://via.placeholder.com/80x80/667eea/ffffff?text=${encodeURIComponent(theatre.name.charAt(0))}`;
  }
}
