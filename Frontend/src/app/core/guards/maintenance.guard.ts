import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SettingsService } from '../services/settings.service';
import { AuthService } from '../services/auth.service';

export const maintenanceGuard: CanActivateFn = (route) => {
  const settingsService = inject(SettingsService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow admin users to bypass maintenance mode
  const currentUser = authService.getCurrentUser();
  if (currentUser?.role === 'ADMIN') {
    return true;
  }

  // Allow access to maintenance page itself
  if (route.routeConfig?.path === 'maintenance') {
    return true;
  }

  // Block access if maintenance mode is enabled
  if (settingsService.maintenanceMode()) {
    router.navigate(['/maintenance']);
    return false;
  }

  return true;
};
