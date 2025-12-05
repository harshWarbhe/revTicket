import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="maintenance-container">
      <div class="maintenance-content">
        <div class="icon">🔧</div>
        <h1>We'll Be Right Back!</h1>
        <p>{{ siteName() }} is currently undergoing scheduled maintenance.</p>
        <p>We apologize for any inconvenience. Please check back soon.</p>
        <div class="contact">
          <p>For urgent inquiries, please contact:</p>
          <p><strong>Email:</strong> {{ siteEmail() }}</p>
          <p><strong>Phone:</strong> {{ sitePhone() }}</p>
        </div>
        <button class="retry-btn" (click)="retry()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .maintenance-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .maintenance-content {
      background: white;
      border-radius: 20px;
      padding: 60px 40px;
      max-width: 600px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .icon {
      font-size: 80px;
      margin-bottom: 20px;
      animation: rotate 3s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    h1 {
      font-size: 32px;
      color: #333;
      margin-bottom: 20px;
    }

    p {
      font-size: 16px;
      color: #666;
      margin-bottom: 15px;
      line-height: 1.6;
    }

    .contact {
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
    }

    .contact p {
      margin: 10px 0;
    }

    .retry-btn {
      margin-top: 20px;
      padding: 12px 40px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 25px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .retry-btn:hover {
      background: #764ba2;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
  `]
})
export class MaintenanceComponent {
  private router = inject(Router);
  private settingsService = inject(SettingsService);

  siteName = this.settingsService.siteName;
  siteEmail = this.settingsService.siteEmail;
  sitePhone = this.settingsService.sitePhone;

  retry() {
    this.settingsService.loadSettings();
    setTimeout(() => {
      if (!this.settingsService.maintenanceMode()) {
        this.router.navigate(['/']);
      }
    }, 500);
  }
}
