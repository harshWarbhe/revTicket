import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User, LoginRequest, SignupRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
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

  signup(userData: SignupRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/signup`, userData)
      .pipe(tap(response => this.setCurrentUser(response)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'ADMIN';
  }

  private setCurrentUser(authResponse: AuthResponse): void {
    try {
      localStorage.setItem('token', authResponse.token);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      this.currentUserSubject.next(authResponse.user);
    } catch (error) {
      console.error('Error storing user data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

  private loadUserFromStorage(): void {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.logout();
    }
  }
}