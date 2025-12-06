import { Routes } from '@angular/router';
import { authGuard } from '../core/guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { AllMoviesComponent } from './pages/all-movies/all-movies.component';
import { MovieDetailsComponent } from './pages/movie-details/movie-details.component';
import { ShowtimesComponent } from './pages/showtimes/showtimes.component';
import { SeatBookingComponent } from './pages/seat-booking/seat-booking.component';
import { PaymentComponent } from './pages/payment/payment.component';
import { PaymentSuccessComponent } from './pages/payment/success/payment-success.component';
import { PaymentFailureComponent } from './pages/payment/failure/payment-failure.component';
import { BookingSuccessComponent } from './pages/booking-success/booking-success.component';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { BookingSummaryComponent } from './pages/booking-summary/booking-summary.component';

export const userRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'movies', component: AllMoviesComponent },
  { path: 'movie-details/:id', component: MovieDetailsComponent },
  { path: 'showtimes/:id', component: ShowtimesComponent },
  { path: 'seat-booking/:showtimeId', component: SeatBookingComponent, canActivate: [authGuard] },
  { path: 'payment/:showtimeId', component: PaymentComponent, canActivate: [authGuard] },
  { path: 'payment-success', component: PaymentSuccessComponent, canActivate: [authGuard] },
  { path: 'payment-failure', component: PaymentFailureComponent, canActivate: [authGuard] },
  { path: 'success/:movieSlug/:bookingSlug', component: BookingSuccessComponent, canActivate: [authGuard] },
  { path: 'my-bookings', component: MyBookingsComponent, canActivate: [authGuard] },
  { path: 'booking-summary', component: BookingSummaryComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];