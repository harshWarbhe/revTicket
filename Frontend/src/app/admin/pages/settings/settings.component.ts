import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AlertService } from '../../../core/services/alert.service';
import { SettingsService } from '../../../core/services/settings.service';

interface Settings {
  siteName: string;
  siteEmail: string;
  sitePhone: string;
  currency: string;
  timezone: string;
  bookingCancellationHours: number;
  convenienceFeePercent: number;
  gstPercent: number;
  maxSeatsPerBooking: number;
  enableNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  maintenanceMode: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private alertService = inject(AlertService);
  private settingsService = inject(SettingsService);

  settings = signal<Settings>({
    siteName: 'RevTicket',
    siteEmail: 'support@revticket.com',
    sitePhone: '+91 1234567890',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    bookingCancellationHours: 2,
    convenienceFeePercent: 5,
    gstPercent: 18,
    maxSeatsPerBooking: 10,
    enableNotifications: true,
    enableEmailNotifications: true,
    enableSMSNotifications: false,
    maintenanceMode: false
  });

  loading = signal(false);
  saving = signal(false);

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.http.get<Settings>(`${environment.apiUrl}/settings`).subscribe({
      next: (data) => {
        this.settings.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem('admin_settings');
        if (saved) {
          try {
            this.settings.set(JSON.parse(saved));
          } catch (e) {}
        }
        this.loading.set(false);
      }
    });
  }

  saveSettings(): void {
    this.saving.set(true);
    this.http.put(`${environment.apiUrl}/admin/settings`, this.settings()).subscribe({
      next: () => {
        localStorage.setItem('admin_settings', JSON.stringify(this.settings()));
        this.settingsService.loadSettings(); // Reload global settings
        this.alertService.success('Settings saved successfully!');
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Save settings error:', err);
        this.alertService.error('Failed to save settings. Please try again.');
        this.saving.set(false);
      }
    });
  }

  resetToDefaults(): void {
    if (!confirm('Reset all settings to default values?')) return;
    
    const defaults: Settings = {
      siteName: 'RevTicket',
      siteEmail: 'support@revticket.com',
      sitePhone: '+91 1234567890',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      bookingCancellationHours: 2,
      convenienceFeePercent: 5,
      gstPercent: 18,
      maxSeatsPerBooking: 10,
      enableNotifications: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false,
      maintenanceMode: false
    };
    
    this.settings.set(defaults);
    this.alertService.success('Settings reset to defaults');
  }

  updateSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.settings.update(s => ({ ...s, [key]: value }));
  }

  getSetting<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings()[key];
  }
}
