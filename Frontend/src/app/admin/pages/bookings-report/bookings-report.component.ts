import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AlertService } from '../../../core/services/alert.service';
import { MovieService } from '../../../core/services/movie.service';
import { TheaterService } from '../../../core/services/theater.service';

interface Summary {
  totalBookings: number;
  totalRevenue: number;
  cancelledBookings: number;
  totalRefunds: number;
  todayBookings: number;
  avgTicketPrice: number;
}

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  movieTitle: string;
  theaterName: string;
  screen: string;
  showtime: string;
  seats: string[];
  totalAmount: number;
  status: string;
  bookingDate: string;
  ticketNumber: string;
}

interface PageResponse {
  content: Booking[];
  totalElements: number;
  totalPages: number;
  number: number;
}

@Component({
  selector: 'app-bookings-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings-report.component.html',
  styleUrls: ['./bookings-report.component.css']
})
export class BookingsReportComponent implements OnInit {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private movieService = inject(MovieService);
  private theaterService = inject(TheaterService);

  fromDate = signal('');
  toDate = signal('');
  selectedMovie = signal('');
  selectedTheater = signal('');
  selectedStatus = signal('');
  searchTerm = signal('');
  currentPage = signal(0);
  pageSize = signal(10);

  summary = signal<Summary>({
    totalBookings: 0,
    totalRevenue: 0,
    cancelledBookings: 0,
    totalRefunds: 0,
    todayBookings: 0,
    avgTicketPrice: 0
  });

  bookings = signal<Booking[]>([]);
  totalElements = signal(0);
  totalPages = signal(0);
  movies = signal<any[]>([]);
  theaters = signal<any[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadMovies();
    this.loadTheaters();
    this.loadData();
  }

  setDefaultDates(): void {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    this.fromDate.set(lastMonth.toISOString().split('T')[0]);
    this.toDate.set(today.toISOString().split('T')[0]);
  }

  loadMovies(): void {
    this.movieService.getMovies().subscribe({
      next: (movies) => this.movies.set(movies),
      error: () => {}
    });
  }

  loadTheaters(): void {
    this.theaterService.getAllTheaters().subscribe({
      next: (theaters) => this.theaters.set(theaters),
      error: () => {}
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.loadSummary();
    this.loadBookings();
  }

  loadSummary(): void {
    const params = new HttpParams()
      .set('fromDate', this.fromDate())
      .set('toDate', this.toDate());

    this.http.get<Summary>(`${environment.apiUrl}/admin/reports/summary`, { params })
      .subscribe({
        next: (data) => this.summary.set(data),
        error: () => {}
      });
  }

  loadBookings(): void {
    let params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('size', this.pageSize().toString());

    if (this.fromDate()) params = params.set('fromDate', this.fromDate());
    if (this.toDate()) params = params.set('toDate', this.toDate());
    if (this.selectedMovie()) params = params.set('movieId', this.selectedMovie());
    if (this.selectedTheater()) params = params.set('theaterId', this.selectedTheater());
    if (this.selectedStatus()) params = params.set('status', this.selectedStatus());
    if (this.searchTerm()) params = params.set('searchTerm', this.searchTerm());

    this.http.get<PageResponse>(`${environment.apiUrl}/admin/reports/bookings`, { params })
      .subscribe({
        next: (data) => {
          this.bookings.set(data.content);
          this.totalElements.set(data.totalElements);
          this.totalPages.set(data.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.alertService.error('Failed to load bookings');
          this.loading.set(false);
        }
      });
  }

  onFilterChange(): void {
    this.currentPage.set(0);
    this.loadData();
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadBookings();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadBookings();
    }
  }

  exportCSV(): void {
    let params = new HttpParams();
    if (this.fromDate()) params = params.set('fromDate', this.fromDate());
    if (this.toDate()) params = params.set('toDate', this.toDate());
    if (this.selectedMovie()) params = params.set('movieId', this.selectedMovie());
    if (this.selectedTheater()) params = params.set('theaterId', this.selectedTheater());
    if (this.selectedStatus()) params = params.set('status', this.selectedStatus());
    if (this.searchTerm()) params = params.set('searchTerm', this.searchTerm());

    this.http.get(`${environment.apiUrl}/admin/reports/export/csv`, { params, responseType: 'text' })
      .subscribe({
        next: (csv) => {
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.alertService.success('Report exported successfully!');
        },
        error: () => this.alertService.error('Failed to export report')
      });
  }

  deleteBooking(booking: Booking): void {
    if (!confirm(`Delete booking ${booking.id.substring(0, 8)}?`)) return;
    this.http.delete(`${environment.apiUrl}/bookings/${booking.id}`).subscribe({
      next: () => {
        this.alertService.success('Booking deleted!');
        this.loadData();
      },
      error: () => this.alertService.error('Failed to delete booking')
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getStartIndex(): number {
    return this.currentPage() * this.pageSize() + 1;
  }

  getEndIndex(): number {
    return Math.min((this.currentPage() + 1) * this.pageSize(), this.totalElements());
  }
}
