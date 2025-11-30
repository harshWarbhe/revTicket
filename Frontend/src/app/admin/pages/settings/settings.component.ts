import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AlertService } from '../../../core/services/alert.service';

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
    const saved = localStorage.getItem('admin_settings');
    if (saved) {
      try {
        this.settings.set(JSON.parse(saved));
      } catch (e) {}
    }
    this.loading.set(false);
  }

  saveSettings(): void {
    this.saving.set(true);
    localStorage.setItem('admin_settings', JSON.stringify(this.settings()));
    setTimeout(() => {
      this.alertService.success('Settings saved successfully!');
      this.saving.set(false);
    }, 300);
  }

  resetToDefaults(): void {
    if (!confirm('Reset all settings to default values?')) return;
    
    this.settings.set({
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
    
    this.alertService.success('Settings reset to defaults');
  }
}
