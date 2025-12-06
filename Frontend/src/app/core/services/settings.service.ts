import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface AppSettings {
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

const DEFAULT_SETTINGS: AppSettings = {
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

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private http = inject(HttpClient);
  
  private settings = signal<AppSettings>(DEFAULT_SETTINGS);
  private loaded = signal(false);

  // Computed signals for easy access
  readonly siteName = computed(() => this.settings().siteName);
  readonly siteEmail = computed(() => this.settings().siteEmail);
  readonly sitePhone = computed(() => this.settings().sitePhone);
  readonly currency = computed(() => this.settings().currency);
  readonly currencySymbol = computed(() => this.getCurrencySymbol(this.settings().currency));
  readonly timezone = computed(() => this.settings().timezone);
  readonly cancellationHours = computed(() => this.settings().bookingCancellationHours);
  readonly maxSeats = computed(() => this.settings().maxSeatsPerBooking);
  readonly convenienceFee = computed(() => this.settings().convenienceFeePercent);
  readonly gst = computed(() => this.settings().gstPercent);
  readonly maintenanceMode = computed(() => this.settings().maintenanceMode);
  readonly isLoaded = computed(() => this.loaded());

  constructor() {
    this.loadSettings();
    this.startPolling();
  }

  private startPolling() {
    // Poll settings every 5 seconds to detect maintenance mode changes
    setInterval(() => {
      this.loadSettings();
    }, 5000);
  }

  loadSettings() {
    this.http.get<AppSettings>(`${environment.apiUrl}/settings`).pipe(
      tap(settings => {
        const wasMaintenanceMode = this.settings().maintenanceMode;
        const wasLoaded = this.loaded();
        this.settings.set(settings);
        this.loaded.set(true);
        
        if (wasLoaded) {
          const currentUserStr = localStorage.getItem('currentUser');
          const isAdmin = currentUserStr ? JSON.parse(currentUserStr).role === 'ADMIN' : false;
          const currentPath = window.location.pathname;
          const isAdminRoute = currentPath.startsWith('/admin');
          
          if (isAdmin || isAdminRoute) {
            return;
          }
          
          if (!wasMaintenanceMode && settings.maintenanceMode) {
            window.location.href = '/maintenance';
          }
          
          if (wasMaintenanceMode && !settings.maintenanceMode && currentPath === '/maintenance') {
            window.location.href = '/user/home';
          }
        }
      })
    ).subscribe({
      error: () => this.loaded.set(true)
    });
  }

  getSettings() {
    return this.settings();
  }

  calculatePrice(baseAmount: number): { base: number; convenienceFee: number; gst: number; total: number } {
    const convenienceFee = Math.round(baseAmount * this.convenienceFee() / 100);
    const subtotal = baseAmount + convenienceFee;
    const gst = Math.round(subtotal * this.gst() / 100);
    return {
      base: baseAmount,
      convenienceFee,
      gst,
      total: subtotal + gst
    };
  }

  canCancelBooking(showtimeDate: Date | string): boolean {
    const showtime = new Date(showtimeDate);
    const now = new Date();
    const hoursUntilShow = (showtime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilShow >= this.cancellationHours();
  }

  formatCurrency(amount: number): string {
    return `${this.currencySymbol()}${amount.toLocaleString('en-IN')}`;
  }

  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  }
}
