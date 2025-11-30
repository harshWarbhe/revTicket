import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { MovieDetailsComponent } from './pages/movie-details/movie-details.component';
import { ShowtimesComponent } from './pages/showtimes/showtimes.component';
import { SeatBookingComponent } from './pages/seat-booking/seat-booking.component';
import { PaymentComponent } from './pages/payment/payment.component';
import { BookingSuccessComponent } from './pages/booking-success/booking-success.component';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { BookingSummaryComponent } from './pages/booking-summary/booking-summary.component';

export const userRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'movies/:slug/:movieId', component: MovieDetailsComponent },
  { path: 'movies/:slug/:movieId/showtimes', component: ShowtimesComponent, canActivate: [authGuard] },
  { path: 'movie/:id/:slug', redirectTo: 'movies/:slug/:id', pathMatch: 'full' },
  { path: 'movie/:id', redirectTo: 'movies/movie/:id', pathMatch: 'full' },
  { path: 'seat-booking', component: SeatBookingComponent, canActivate: [authGuard] },
  { path: 'payment', component: PaymentComponent, canActivate: [authGuard] },
  { path: 'success/:bookingId', component: BookingSuccessComponent, canActivate: [authGuard] },
  { path: 'my-bookings', component: MyBookingsComponent, canActivate: [authGuard] },
  { path: 'booking-summary', component: BookingSummaryComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];