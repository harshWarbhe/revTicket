import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../../core/services/location.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="location-selector">
      <button class="location-btn" (click)="toggleDropdown()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{{ locationService.selectedCity() || 'Select City' }}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      @if (showDropdown()) {
        <div class="dropdown">
          <div class="dropdown-header">
            <button class="detect-btn" (click)="detectLocation()" [disabled]="locationService.isDetecting()">
              @if (locationService.isDetecting()) {
                <span class="spinner"></span>
                <span>Detecting...</span>
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Detect Location</span>
              }
            </button>
          </div>
          <div class="cities-list">
            <button 
              class="city-item"
              [class.active]="locationService.selectedCity() === null"
              (click)="selectAllCities()">
              All Cities
            </button>
            @for (city of locationService.cities(); track city.name) {
              <button 
                class="city-item"
                [class.active]="city.name === locationService.selectedCity()"
                (click)="selectCity(city.name)">
                {{ city.name }}, {{ city.state }}
              </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .location-selector {
      position: relative;
    }

    .location-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s;
    }

    .location-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      min-width: 280px;
      z-index: 1000;
      overflow: hidden;
    }

    .dropdown-header {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }

    .detect-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: transform 0.2s;
    }

    .detect-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    .detect-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .cities-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .city-item {
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      transition: background 0.2s;
    }

    .city-item:hover {
      background: #f5f5f5;
    }

    .city-item.active {
      background: #667eea;
      color: white;
      font-weight: 500;
    }
  `]
})
export class LocationSelectorComponent {
  locationService = inject(LocationService);
  private alertService = inject(AlertService);
  showDropdown = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.location-selector')) {
      this.showDropdown.set(false);
    }
  }

  toggleDropdown(): void {
    this.showDropdown.update(v => !v);
  }

  selectCity(city: string): void {
    this.locationService.setCity(city);
    this.showDropdown.set(false);
  }

  selectAllCities(): void {
    this.locationService.clearCity();
    this.locationService.markAsPrompted();
    this.showDropdown.set(false);
  }

  async detectLocation(): Promise<void> {
    await this.locationService.detectLocation();
    
    const error = this.locationService.detectionError();
    if (error) {
      this.alertService.error(error);
    } else {
      const city = this.locationService.selectedCity();
      if (city) {
        this.alertService.success(`Location set to ${city}`);
        this.showDropdown.set(false);
      }
    }
  }
}
