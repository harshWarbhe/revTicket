import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, LoginRequest, SignupRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSignal = signal<User | null>(null);
  public currentUser = this.currentUserSignal.asReadonly();
  public isAuthenticated = computed(() => {
    const user = this.currentUserSignal();
    const token = localStorage.getItem('token');
    if (token && !this.isTokenValid(token)) {
      return false;
    }
    return !!(user && token);
  });
  public isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response && response.token && response.user) {
            this.setCurrentUser(response);
          } else {
            throw new Error('Invalid response from server');
          }
        })
      );
  }

  getRedirectUrl(): string | null {
    return localStorage.getItem('redirectUrl');
  }

  clearRedirectUrl(): void {
    localStorage.removeItem('redirectUrl');
  }

  signup(userData: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/signup`, userData)
      .pipe(tap(response => this.setCurrentUser(response)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSignal.set(null);
  }

  private setCurrentUser(authResponse: AuthResponse): void {
    try {
      localStorage.setItem('token', authResponse.token);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      this.currentUserSignal.set(authResponse.user);
    } catch (error) {
      throw new Error('Failed to store authentication data');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSignal();
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/reset-password`, { token, newPassword });
  }

  oauth2Login(oauth2Data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/oauth2/login`, oauth2Data)
      .pipe(tap(response => this.setCurrentUser(response)));
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/change-password`, data);
  }

  private loadUserFromStorage(): void {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr && this.isTokenValid(token)) {
        const user = JSON.parse(userStr);
        this.currentUserSignal.set(user);
      } else if (token || userStr) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
}