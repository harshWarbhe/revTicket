import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Store the attempted URL for redirect after login
    localStorage.setItem('redirectUrl', state.url);
    router.navigate(['/auth/login']);
    return false;
  }
  
  if (!authService.isAdmin()) {
    console.warn('Access denied: Admin privileges required');
    router.navigate(['/user/home']);
    return false;
  }
  
  return true;
};