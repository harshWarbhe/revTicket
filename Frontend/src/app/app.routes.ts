import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { maintenanceGuard } from './core/guards/maintenance.guard';
import { MaintenanceComponent } from './shared/components/maintenance/maintenance.component';

export const routes: Routes = [
  { path: '', redirectTo: '/user/home', pathMatch: 'full' },
  { path: 'maintenance', component: MaintenanceComponent },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.authRoutes),
    canActivate: [maintenanceGuard]
  },
  {
    path: 'user',
    loadChildren: () => import('./user/user.routes').then(m => m.userRoutes),
    canActivate: [maintenanceGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: '/user/home' }
];