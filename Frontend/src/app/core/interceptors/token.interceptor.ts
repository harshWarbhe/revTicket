import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');
  
  // Skip token validation for auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }
  
  if (token && isTokenValid(token)) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  } else if (token) {
    // Token exists but is invalid/expired
    authService.logout();
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