import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieService } from '../../../core/services/movie.service';
import { AlertService } from '../../../core/services/alert.service';
import { LanguageService } from '../../../core/services/language.service';
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
  private languageService = inject(LanguageService);
  private sanitizer = inject(DomSanitizer);

  movieForm: FormGroup;
  isEditMode = signal(false);
  editingMovieId = signal<string | null>(null);
  loading = signal(false);
  submitting = signal(false);
  posterPreview = signal<string>('');
  backgroundPreview = signal<string>('');
  trailerPreview = signal<string>('');
  loadingPoster = signal(false);
  loadingBackground = signal(false);
  loadingTrailer = signal(false);

  availableGenres = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
    'Documentary', 'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery',
    'Romance', 'Sci-Fi', 'Sports', 'Thriller', 'War', 'Western'
  ];
  selectedGenres = signal<string[]>([]);
  availableLanguages = signal<string[]>([]);

  constructor() {
    this.movieForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      duration: ['', [Validators.required, Validators.min(1)]],
      director: [''],
      language: ['', Validators.required],
      releaseDate: ['', Validators.required],
      posterUrl: [''],
      backgroundUrl: [''],
      trailerUrl: ['']
    });
  }

  ngOnInit(): void {
    this.loadLanguages();
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.editingMovieId.set(params['id']);
        this.loadMovieForEdit();
      }
    });
  }

  loadLanguages(): void {
    this.languageService.getAllLanguages().subscribe({
      next: (languages) => {
        this.availableLanguages.set(languages.map(l => l.name));
        if (languages.length === 0) {
          this.languageService.initializeLanguages().subscribe();
        }
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
          backgroundUrl: movie.backgroundUrl || '',
          trailerUrl: movie.trailerUrl || ''
        });
        
        if (Array.isArray(movie.genre)) {
          this.selectedGenres.set(movie.genre);
        } else if (typeof movie.genre === 'string') {
          this.selectedGenres.set((movie.genre as string).split(',').map((g: string) => g.trim()));
        }
        
        if (movie.posterUrl) this.posterPreview.set(movie.posterUrl);
        if (movie.backgroundUrl) this.backgroundPreview.set(movie.backgroundUrl);
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

  toggleGenre(genre: string): void {
    const current = this.selectedGenres();
    if (current.includes(genre)) {
      this.selectedGenres.set(current.filter(g => g !== genre));
    } else {
      this.selectedGenres.set([...current, genre]);
    }
  }

  getAvailableGenres(): string[] {
    return this.availableGenres.filter(g => !this.selectedGenres().includes(g));
  }

  onSubmit(): void {
    if (this.movieForm.valid && this.selectedGenres().length > 0) {
      this.submitting.set(true);
      const formValue = this.movieForm.value;

      const movieData: any = {
        title: formValue.title,
        description: formValue.description,
        duration: parseInt(formValue.duration),
        director: formValue.director || null,
        genre: this.selectedGenres(),
        language: formValue.language,
        releaseDate: new Date(formValue.releaseDate),
        posterUrl: formValue.posterUrl || null,
        backgroundUrl: formValue.backgroundUrl || null,
        trailerUrl: formValue.trailerUrl || null,
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
    if (file && file.type.startsWith('image/')) {
      this.loadingPoster.set(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.posterPreview.set(e.target?.result as string);
        this.movieForm.patchValue({ posterUrl: e.target?.result as string });
        this.loadingPoster.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  onBackgroundFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('image/')) {
      this.loadingBackground.set(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.backgroundPreview.set(e.target?.result as string);
        this.movieForm.patchValue({ backgroundUrl: e.target?.result as string });
        this.loadingBackground.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  onTrailerFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type.startsWith('video/')) {
      this.loadingTrailer.set(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.trailerPreview.set(e.target?.result as string);
        this.movieForm.patchValue({ trailerUrl: e.target?.result as string });
        this.loadingTrailer.set(false);
      };
      reader.readAsDataURL(file);
    }
  }

  loadPosterPreview(): void {
    const url = this.movieForm.get('posterUrl')?.value?.trim();
    if (!url) return;
    
    this.loadingPoster.set(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.posterPreview.set(url);
      this.loadingPoster.set(false);
    };
    img.onerror = () => {
      this.posterPreview.set(url);
      this.loadingPoster.set(false);
    };
    img.src = url;
  }

  loadBackgroundPreview(): void {
    const url = this.movieForm.get('backgroundUrl')?.value?.trim();
    if (!url) return;
    
    this.loadingBackground.set(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.backgroundPreview.set(url);
      this.loadingBackground.set(false);
    };
    img.onerror = () => {
      this.backgroundPreview.set(url);
      this.loadingBackground.set(false);
    };
    img.src = url;
  }

  loadTrailerPreview(): void {
    const url = this.movieForm.get('trailerUrl')?.value?.trim();
    if (!url) return;
    
    this.loadingTrailer.set(true);
    this.trailerPreview.set(url);
    setTimeout(() => {
      this.loadingTrailer.set(false);
    }, 300);
  }

  isImage(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(url) || url.startsWith('data:image');
  }

  isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg)$/i.test(url) || url.startsWith('data:video');
  }

  getYouTubeEmbedUrl(url: string): SafeResourceUrl | null {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }
    return videoId ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`) : null;
  }

  isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
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
