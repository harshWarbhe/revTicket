import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddMovieComponent } from './pages/add-movie/add-movie.component';
import { ManageMoviesComponent } from './pages/manage-movies/manage-movies.component';
import { BookingsReportComponent } from './pages/bookings-report/bookings-report.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { UsersComponent } from './pages/users/users.component';
import { BookingsComponent } from './pages/bookings/bookings.component';
import { ManageShowsComponent } from './pages/manage-shows/manage-shows.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { VenueManagementComponent } from './pages/venue-management/venue-management.component';
import { ReviewsComponent } from './pages/reviews/reviews.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'add-movie', component: AddMovieComponent },
      { path: 'manage-movies', component: ManageMoviesComponent },
      { path: 'manage-shows', component: ManageShowsComponent },
      { path: 'venues', component: VenueManagementComponent },
      { path: 'venues/:theatreId', component: VenueManagementComponent },
      { path: 'venues/:theatreId/:screenId', component: VenueManagementComponent },
      { path: 'manage-theatres', redirectTo: 'venues', pathMatch: 'full' },
      { path: 'screens', redirectTo: 'venues', pathMatch: 'full' },
      { path: 'bookings', component: BookingsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'bookings-report', component: BookingsReportComponent },
      { path: 'reviews', component: ReviewsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];