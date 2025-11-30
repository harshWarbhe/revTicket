import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AddMovieComponent } from './pages/add-movie/add-movie.component';
import { ManageMoviesComponent } from './pages/manage-movies/manage-movies.component';
import { ManageShowsComponent } from './pages/manage-shows/manage-shows.component';
import { BookingsReportComponent } from './pages/bookings-report/bookings-report.component';
import { ManageTheatresComponent } from './pages/manage-theatres/manage-theatres.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { UsersComponent } from './pages/users/users.component';
import { BookingsComponent } from './pages/bookings/bookings.component';


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
      { path: 'manage-theatres', component: ManageTheatresComponent },
      { path: 'bookings', component: BookingsComponent },
      { path: 'users', component: UsersComponent },
      { path: 'bookings-report', component: BookingsReportComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];