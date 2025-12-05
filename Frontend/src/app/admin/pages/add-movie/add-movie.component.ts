import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MovieService } from '../../../core/services/movie.service';
import { AlertService } from '../../../core/services/alert.service';
import { Movie } from '../../../core/models/movie.model';

@Component({
  selector: 'app-add-movie',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-movie.component.html',
  styleUrls: ['./add-movie.component.css']
})
export class AddMovieComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private movieService = inject(MovieService);
  private alertService = inject(AlertService);

  movieForm: FormGroup;
  isEditMode = signal(false);
  editingMovieId = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);
  posterPreview = signal<string>('');
  trailerPreview = signal<string>('');

  availableGenres = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery',
    'Romance', 'Sci-Fi', 'Sports', 'Thriller', 'War', 'Western'
  ];
  selectedGenres = signal<string[]>([]);

  constructor() {
    this.movieForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      duration: ['', [Validators.required, Validators.min(1)]],
      director: [''],
      language: ['English', Validators.required],
      releaseDate: ['', Validators.required],
      posterUrl: [''],
      trailerUrl: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.editingMovieId.set(params['id']);
        this.loadMovieForEdit();
      }
    });
  }

  loadMovieForEdit(): void {
    const movieId = this.editingMovieId();
    if (!movieId) return;

    this.loading.set(true);
    this.movieService.getAdminMovieById(movieId).subscribe({
      next: (movie) => {
        this.movieForm.patchValue({
          title: movie.title,
          description: movie.description || '',
          duration: movie.duration,
          director: movie.director || '',
          language: movie.language || 'English',
          releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
          posterUrl: movie.posterUrl || '',
          trailerUrl: movie.trailerUrl || ''
        });
        
        if (Array.isArray(movie.genre)) {
          this.selectedGenres.set(movie.genre);
        } else if (typeof movie.genre === 'string') {
          this.selectedGenres.set((movie.genre as string).split(',').map((g: string) => g.trim()));
        }
        
        if (movie.posterUrl) this.posterPreview.set(movie.posterUrl);
        if (movie.trailerUrl) this.trailerPreview.set(movie.trailerUrl);
        this.loading.set(false);
      },
      error: () => {
        this.alertService.error('Failed to load movie details');
        this.loading.set(false);
        this.router.navigate(['/admin/manage-movies']);
      }
    });
  }

  onGenreSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(select.selectedOptions).map(opt => opt.value);
    const newGenres = selectedOptions.filter(g => g && !this.selectedGenres().includes(g));
    if (newGenres.length > 0) {
      this.selectedGenres.set([...this.selectedGenres(), ...newGenres]);
    }
  }

  removeGenre(genre: string): void {
    this.selectedGenres.set(this.selectedGenres().filter(g => g !== genre));
  }

  getAvailableGenres(): string[] {
    return this.availableGenres.filter(g => !this.selectedGenres().includes(g));
  }

  onSubmit(): void {
    if (this.movieForm.valid && this.selectedGenres().length > 0) {
      this.submitting.set(true);
      const formValue = this.movieForm.value;

      const movieData: Partial<Movie> = {
        title: formValue.title,
        description: formValue.description,
        duration: parseInt(formValue.duration),
        director: formValue.director || undefined,
        genre: this.selectedGenres(),
        language: formValue.language,
        releaseDate: new Date(formValue.releaseDate),
        posterUrl: formValue.posterUrl || undefined,
        trailerUrl: formValue.trailerUrl || undefined,
        isActive: true
      };

      const movieId = this.editingMovieId();
      if (this.isEditMode() && movieId) {
        this.movieService.updateMovie(movieId, movieData).subscribe({
          next: () => {
            this.alertService.success('Movie updated successfully!');
            this.submitting.set(false);
            this.router.navigate(['/admin/manage-movies']);
          },
          error: () => {
            this.alertService.error('Failed to update movie');
            this.submitting.set(false);
          }
        });
      } else {
        this.movieService.addMovie(movieData).subscribe({
          next: () => {
            this.alertService.success('Movie added successfully!');
            this.submitting.set(false);
            this.router.navigate(['/admin/manage-movies']);
          },
          error: () => {
            this.alertService.error('Failed to add movie');
            this.submitting.set(false);
          }
        });
      }
    } else {
      Object.keys(this.movieForm.controls).forEach(key => {
        this.movieForm.get(key)?.markAsTouched();
      });
      if (this.selectedGenres().length === 0) {
        this.alertService.error('Please select at least one genre');
      } else {
        this.alertService.error('Please fill all required fields correctly');
      }
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/manage-movies']);
  }

  getPageTitle(): string {
    return this.isEditMode() ? 'Edit Movie' : 'Add New Movie';
  }

  getSubmitButtonText(): string {
    return this.isEditMode() ? 'Update Movie' : 'Add Movie';
  }

  onPosterFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.posterPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      this.movieForm.patchValue({ posterUrl: '' });
    }
  }

  onTrailerFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.trailerPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      this.movieForm.patchValue({ trailerUrl: '' });
    }
  }

  loadPosterPreview(): void {
    const url = this.movieForm.get('posterUrl')?.value?.trim();
    if (url) {
      this.posterPreview.set(url);
    }
  }

  loadTrailerPreview(): void {
    const url = this.movieForm.get('trailerUrl')?.value?.trim();
    if (url) {
      this.trailerPreview.set(url);
    }
  }

  isImage(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(url) || url.startsWith('data:image');
  }

  isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video');
  }

  getFieldError(fieldName: string): string {
    const field = this.movieForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field?.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is too short`;
    }
    if (field?.hasError('min')) {
      return `Value must be at least ${field.errors?.['min'].min}`;
    }
    if (field?.hasError('max')) {
      return `Value must be at most ${field.errors?.['max'].max}`;
    }
    if (field?.hasError('pattern')) {
      return 'Please enter a valid decimal number (e.g., 7.5)';
    }
    return '';
  }
}
