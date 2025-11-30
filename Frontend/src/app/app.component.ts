import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AlertComponent } from './shared/components/alert/alert.component';
import { AuthDebugComponent } from './shared/components/auth-debug/auth-debug.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, AlertComponent, AuthDebugComponent],
  template: `
    @if (!isAdminRoute) {
      <app-navbar></app-navbar>
    }
    <router-outlet></router-outlet>
    @if (!isAdminRoute) {
      <app-footer></app-footer>
    }
    <app-alert></app-alert>
    <app-auth-debug></app-auth-debug>
  `,
  styles: []
})
export class AppComponent {
  title = 'RevTicket';
  isAdminRoute = false;
  private router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isAdminRoute = event.url.startsWith('/admin');
        window.scrollTo(0, 0);
      });
  }
}