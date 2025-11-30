import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-debug" *ngIf="showDebug">
      <h4>Auth Debug Info</h4>
      <p><strong>Authenticated:</strong> {{ authService.isAuthenticated() }}</p>
      <p><strong>Is Admin:</strong> {{ authService.isAdmin() }}</p>
      <p><strong>Current User:</strong> {{ currentUser?.name || 'None' }}</p>
      <p><strong>User Role:</strong> {{ currentUser?.role || 'None' }}</p>
      <p><strong>Token Exists:</strong> {{ !!token }}</p>
      <p><strong>Token Valid:</strong> {{ isTokenValid }}</p>
      <button (click)="toggleDebug()" class="btn btn-sm btn-secondary">Hide Debug</button>
    </div>
    <button *ngIf="!showDebug" (click)="toggleDebug()" class="btn btn-sm btn-info">Show Auth Debug</button>
  `,
  styles: [`
    .auth-debug {
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 15px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 9999;
      max-width: 300px;
    }
    .auth-debug h4 {
      margin: 0 0 10px 0;
      color: #ffc107;
    }
    .auth-debug p {
      margin: 5px 0;
    }
  `]
})
export class AuthDebugComponent {
  authService = inject(AuthService);
  showDebug = false;

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get token() {
    return localStorage.getItem('token');
  }

  get isTokenValid() {
    const token = this.token;
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  toggleDebug() {
    this.showDebug = !this.showDebug;
  }
}