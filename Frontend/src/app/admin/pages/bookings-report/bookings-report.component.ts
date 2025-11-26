import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { MovieService } from '../../../core/services/movie.service';
import { TheaterService } from '../../../core/services/theater.service';
import { AlertService } from '../../../core/services/alert.service';
import { Booking } from '../../../core/models/booking.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bookings-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bookings-report.component.html',
  styleUrls: ['./bookings-report.component.css']
})
export class BookingsReportComponent implements OnInit {
  // Summary data
  totalBookings = 0;
  totalRevenue = 0;
  todayBookings = 0;
  avgTicketsPerBooking = 0;
  cancelledBookings = 0;

  // Filter properties
  fromDate = '';
  toDate = '';
  selectedMovie = '';
  selectedTheater = '';
  selectedStatus = '';
  searchTerm = '';
  weekDayLabels: string[] = [];

  // Data
  allBookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  movies: any[] = [];
  theaters: any[] = [];

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  loading = false;

  constructor(
    private bookingService: BookingService,
    private movieService: MovieService,
    private theaterService: TheaterService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.setDefaultDates();
    this.generateWeekDayLabels();
    this.loadData();
  }

  generateWeekDayLabels(): void {
    const labels: string[] = [];
    const today = new Date();
  
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      labels.push(
        d.toLocaleDateString('en-US', { weekday: 'short' })  // Mon, Tue, Wed
      );
    }
  
    this.weekDayLabels = labels;
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      bookings: this.bookingService.getAllBookings(),
      movies: this.movieService.getMovies(),
      theaters: this.theaterService.getAllTheaters()
    }).subscribe({
      next: ({ bookings, movies, theaters }) => {
        this.allBookings = bookings;
        this.movies = movies;
        this.theaters = theaters;
        this.calculateSummary();
        this.filterBookings();
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.alertService.error('Failed to load bookings data');
        this.loading = false;
      }
    });
  }

  setDefaultDates(): void {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    
    this.fromDate = lastMonth.toISOString().split('T')[0];
    this.toDate = today.toISOString().split('T')[0];
  }

  calculateSummary(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.totalBookings = this.allBookings.length;
    
    const confirmedBookings = this.allBookings.filter(b => b.status === 'CONFIRMED');
    this.totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    this.todayBookings = this.allBookings.filter(b => {
      const bookingDate = new Date(b.bookingDate);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    }).length;

    this.cancelledBookings = this.allBookings.filter(b => b.status === 'CANCELLED').length;

    const totalTickets = this.allBookings.reduce((sum, b) => sum + (b.seats?.length || 0), 0);
    this.avgTicketsPerBooking = this.totalBookings > 0 ? totalTickets / this.totalBookings : 0;
  }

  onFilterChange(): void {
    this.filterBookings();
    this.currentPage = 1;
    this.updatePagination();
  }

  onSearch(): void {
    this.filterBookings();
    this.currentPage = 1;
    this.updatePagination();
  }

  filterBookings(): void {
    this.filteredBookings = this.allBookings.filter(booking => {
      // Date filter
      let matchesDate = true;
      if (this.fromDate && this.toDate) {
        const bookingDate = new Date(booking.bookingDate);
        const from = new Date(this.fromDate);
        const to = new Date(this.toDate);
        to.setHours(23, 59, 59, 999);
        matchesDate = bookingDate >= from && bookingDate <= to;
      }

      // Search filter
      const matchesSearch = !this.searchTerm || 
        (booking.customerName && booking.customerName.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (booking.customerEmail && booking.customerEmail.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (booking.id && booking.id.toLowerCase().includes(this.searchTerm.toLowerCase()));

      // Movie filter
      const matchesMovie = !this.selectedMovie || booking.movieTitle === this.selectedMovie;

      // Theater filter
      const matchesTheater = !this.selectedTheater || booking.theaterName === this.selectedTheater;

      // Status filter
      const matchesStatus = !this.selectedStatus || booking.status === this.selectedStatus;

      return matchesDate && matchesSearch && matchesMovie && matchesTheater && matchesStatus;
    });

    this.calculateSummary();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredBookings.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
  }

  get paginatedBookings() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredBookings.slice(start, end);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  exportReport(): void {
    this.alertService.info('Export functionality will be available soon!');
  }

  refreshData(): void {
    this.loadData();
    this.alertService.success('Data refreshed successfully!');
  }

  viewBooking(booking: Booking): void {
    this.alertService.info(`Booking ID: ${booking.id}`);
  }

  downloadTicket(booking: Booking): void {
    this.alertService.info(`Download ticket for booking ${booking.id}`);
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredBookings.length);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getDailyBookingsData(): number[] {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const count = this.filteredBookings.filter(b => {
        const bookingDate = new Date(b.bookingDate);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === date.getTime();
      }).length;
      
      last7Days.push(count);
    }
    
    return last7Days;
  }

  getPopularMovies(): any[] {
    const movieStats = new Map<string, { title: string; bookings: number }>();
    
    this.filteredBookings.forEach(booking => {
      const key = booking.movieId || booking.movieTitle;
      const current = movieStats.get(key) || { title: booking.movieTitle, bookings: 0 };
      current.bookings++;
      movieStats.set(key, current);
    });
    
    const sorted = Array.from(movieStats.values())
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 3);
    
    const maxBookings = Math.max(...sorted.map(s => s.bookings), 1);
    
    return sorted.map(stat => ({
      ...stat,
      percentage: (stat.bookings / maxBookings) * 100
    }));
  }

  getMaxBookings(): number {
    const data = this.getDailyBookingsData();
    return Math.max(...data, 1);
  }

  getBarHeight(count: number): string {
    const max = this.getMaxBookings();
    return `${(count / max) * 100}%`;
  }

  trackByBookingId(index: number, booking: Booking): string {
    return booking.id;
  }
}
