import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MovieService } from './movie.service';
import { BookingService } from './booking.service';
import { UserService } from './user.service';
import { TheaterService } from './theater.service';
import { ShowtimeService } from './showtime.service';

export interface DashboardStats {
  totalMovies: number;
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  todayBookings: number;
  cancelledBookings: number;
  activeMovies: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

export interface RecentActivity {
  id: string;
  type: 'booking' | 'movie' | 'user' | 'theater';
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(
    private http: HttpClient,
    private movieService: MovieService,
    private bookingService: BookingService,
    private userService: UserService,
    private theaterService: TheaterService,
    private showtimeService: ShowtimeService
  ) {}

  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      movies: this.movieService.getMovies(),
      bookings: this.bookingService.getAllBookings(),
      users: this.userService.getAllUsers()
    }).pipe(
      map(({ movies, bookings, users }) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayBookings = bookings.filter(b => {
          const bookingDate = new Date(b.bookingDate);
          bookingDate.setHours(0, 0, 0, 0);
          return bookingDate.getTime() === today.getTime();
        });

        const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
        const activeMovies = movies.filter(m => m.isActive).length;

        return {
          totalMovies: movies.length,
          totalBookings: bookings.length,
          totalRevenue,
          totalUsers: users.length,
          todayBookings: todayBookings.length,
          cancelledBookings,
          activeMovies
        };
      })
    );
  }

  getRevenueData(days: number = 7): Observable<RevenueData[]> {
    return this.bookingService.getAllBookings().pipe(
      map(bookings => {
        const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
        const revenueMap = new Map<string, number>();
        const today = new Date();
        
        // Initialize last N days
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          revenueMap.set(dateStr, 0);
        }

        // Calculate revenue per day
        confirmedBookings.forEach(booking => {
          const bookingDate = new Date(booking.bookingDate);
          const dateStr = bookingDate.toISOString().split('T')[0];
          const current = revenueMap.get(dateStr) || 0;
          revenueMap.set(dateStr, current + (booking.totalAmount || 0));
        });

        return Array.from(revenueMap.entries()).map(([date, revenue]) => ({
          date,
          revenue
        }));
      })
    );
  }

  getRecentActivity(limit: number = 10): Observable<RecentActivity[]> {
    return forkJoin({
      bookings: this.bookingService.getAllBookings(),
      movies: this.movieService.getMovies()
    }).pipe(
      map(({ bookings, movies }) => {
        const activities: RecentActivity[] = [];

        // Recent bookings
        bookings
          .sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
          .slice(0, 5)
          .forEach(booking => {
            activities.push({
              id: booking.id,
              type: 'booking',
              message: `New booking for ${booking.movieTitle}`,
              timestamp: new Date(booking.bookingDate)
            });
          });

        // Sort by timestamp and return limited results
        return activities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, limit);
      })
    );
  }

  getPopularMovies(limit: number = 5): Observable<any[]> {
    return forkJoin({
      movies: this.movieService.getMovies(),
      bookings: this.bookingService.getAllBookings()
    }).pipe(
      map(({ movies, bookings }) => {
        const movieStats = new Map<string, { movie: any; bookings: number }>();

        movies.forEach(movie => {
          movieStats.set(movie.id, {
            movie,
            bookings: 0
          });
        });

        bookings.forEach(booking => {
          const stat = movieStats.get(booking.movieId);
          if (stat) {
            stat.bookings++;
          }
        });

        return Array.from(movieStats.values())
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, limit)
          .map(stat => ({
            ...stat.movie,
            bookingCount: stat.bookings
          }));
      })
    );
  }
}

