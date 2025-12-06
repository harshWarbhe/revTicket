import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

let tokenCleanupDone = false;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  if (req.url.includes('/auth/') || req.url.includes('/settings')) {
    return next(req);
  }
  
  if (token && isTokenValid(token)) {
    tokenCleanupDone = false;
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  } else if (token && !tokenCleanupDone) {
    tokenCleanupDone = true;
    authService.logout();
    router.navigate(['/auth/login']);
  }
  
  return next(req);
};

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
}