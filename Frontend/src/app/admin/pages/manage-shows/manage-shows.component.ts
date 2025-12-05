import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { AlertService } from '../../../core/services/alert.service';

interface Movie {
  id: string;
  title: string;
  duration: number;
}

interface Theater {
  id: string;
  name: string;
  location: string;
}

interface Screen {
  id: string;
  name: string;
  totalSeats: number;
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
  movie?: { title: string };
  theater?: { name: string; location: string };
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
  
  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingShowId = signal<string | null>(null);
  
  selectedMovieId = '';
  selectedTheaterId = '';
  selectedScreenId = '';
  showDateTime = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    this.http.get<any>(`${environment.apiUrl}/admin/movies`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data || response;
          this.movies.set(Array.isArray(data) ? data : []);
        },
        error: () => this.movies.set([])
      });
    
    this.http.get<Theater[]>(`${environment.apiUrl}/admin/theatres`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.theaters.set(Array.isArray(data) ? data : []),
        error: () => this.theaters.set([])
      });
    
    this.http.get<Screen[]>(`${environment.apiUrl}/admin/screens`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.allScreens.set(Array.isArray(data) ? data : []),
        error: () => this.allScreens.set([])
      });
    
    this.http.get<Showtime[]>(`${environment.apiUrl}/admin/showtimes`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const now = new Date();
          const sorted = (Array.isArray(data) ? data : []).sort((a, b) => {
            const aDate = new Date(a.showDateTime);
            const bDate = new Date(b.showDateTime);
            const aUpcoming = aDate > now;
            const bUpcoming = bDate > now;
            
            // Upcoming shows first
            if (aUpcoming && !bUpcoming) return -1;
            if (!aUpcoming && bUpcoming) return 1;
            
            // Within same category (upcoming/past), sort by date
            if (aUpcoming && bUpcoming) {
              return aDate.getTime() - bDate.getTime(); // Nearest first
            } else {
              return bDate.getTime() - aDate.getTime(); // Most recent first
            }
          });
          this.shows.set(sorted);
          this.loading.set(false);
        },
        error: () => {
          this.shows.set([]);
          this.loading.set(false);
        }
      });
  }

  onTheaterChange(): void {
    this.selectedScreenId = '';
    this.screens.set([]);
    
    if (!this.selectedTheaterId) return;
    
    this.http.get<Screen[]>(`${environment.apiUrl}/admin/screens?theatreId=${this.selectedTheaterId}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.screens.set(Array.isArray(data) ? data : []),
        error: () => this.screens.set([])
      });
  }

  addShow(): void {
    this.editingShowId.set(null);
    this.selectedMovieId = '';
    this.selectedTheaterId = '';
    this.selectedScreenId = '';
    this.showDateTime = '';
    this.screens.set([]);
    this.showForm.set(true);
  }

  editShow(show: Showtime): void {
    this.editingShowId.set(show.id);
    this.selectedMovieId = show.movieId;
    this.selectedTheaterId = show.theaterId;
    this.selectedScreenId = show.screen;
    this.showDateTime = new Date(show.showDateTime).toISOString().slice(0, 16);
    
    this.onTheaterChange();
    setTimeout(() => this.showForm.set(true), 100);
  }

  toggleStatus(show: Showtime): void {
    const newStatus = show.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    this.http.patch<Showtime>(`${environment.apiUrl}/admin/showtimes/${show.id}/status`, { status: newStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.alertService.success(`Show ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
          this.shows.update(shows => shows.map(s => s.id === show.id ? { ...s, status: newStatus } : s));
        },
        error: () => this.alertService.error('Failed to update status')
      });
  }

  deleteShow(show: Showtime): void {
    if (!confirm(`Delete show for "${show.movie?.title}" at ${this.formatDateTime(show.showDateTime)}?`)) return;
    
    this.http.delete(`${environment.apiUrl}/admin/showtimes/${show.id}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.alertService.success('Show deleted successfully');
          this.shows.update(shows => shows.filter(s => s.id !== show.id));
        },
        error: () => this.alertService.error('Failed to delete show')
      });
  }

  saveShow(): void {
    if (!this.selectedMovieId || !this.selectedTheaterId || !this.selectedScreenId || !this.showDateTime) {
      this.alertService.error('Please fill all required fields');
      return;
    }

    const screen = this.allScreens().find(s => s.id === this.selectedScreenId);
    const totalSeats = screen?.totalSeats || 0;
    const editId = this.editingShowId();

    const payload: any = {
      movieId: this.selectedMovieId,
      theaterId: this.selectedTheaterId,
      screen: this.selectedScreenId,
      showDateTime: this.showDateTime,
      ticketPrice: 1,
      totalSeats: totalSeats,
      availableSeats: totalSeats
    };

    // Determine status based on date
    const showDate = new Date(this.showDateTime);
    const now = new Date();
    
    if (!editId) {
      // New show: ACTIVE if future, INACTIVE if past
      payload.status = showDate > now ? 'ACTIVE' : 'INACTIVE';
    } else {
      // Editing: preserve status unless date changed to past
      const existingShow = this.shows().find(s => s.id === editId);
      if (showDate < now) {
        payload.status = 'INACTIVE';
      } else {
        payload.status = existingShow?.status || 'ACTIVE';
      }
    }

    this.saving.set(true);
    const request$ = editId
      ? this.http.put(`${environment.apiUrl}/admin/showtimes/${editId}`, payload)
      : this.http.post(`${environment.apiUrl}/admin/showtimes`, payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.alertService.success(`Show ${editId ? 'updated' : 'created'} successfully`);
        this.cancelForm();
        this.loadData();
        this.saving.set(false);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Failed to save show';
        this.alertService.error(errorMsg);
        this.saving.set(false);
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
    this.screens.set([]);
  }

  getScreenName(screenId: string): string {
    const screen = this.allScreens().find(s => s.id === screenId);
    return screen?.name || screenId;
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  isUpcoming(dateTime: string): boolean {
    return new Date(dateTime) > new Date();
  }
}
