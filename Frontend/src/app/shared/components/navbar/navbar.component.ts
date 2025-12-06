import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { LocationService } from '../../../core/services/location.service';
import { LocationSelectorComponent } from '../location-selector/location-selector.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, LocationSelectorComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  settingsService = inject(SettingsService);
  locationService = inject(LocationService);
  
  currentUser = this.authService.currentUser;
  showUserMenu = signal(false);

  toggleUserMenu(): void {
    this.showUserMenu.update(show => !show);
  }

  onSearch(value: string): void {
    if (value.trim()) {
      this.router.navigate(['/user/showtimes'], { queryParams: { search: value } });
    }
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
