import { Component, inject, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService, Alert } from '../../../core/services/alert.service';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent {
  alertService = inject(AlertService);
  alerts = this.alertService.alerts;
  fadingAlerts = signal<Set<string>>(new Set());

  constructor() {
    effect(() => {
      const currentAlerts = this.alerts();
      currentAlerts.forEach(alert => {
        if (alert.autoClose) {
          setTimeout(() => this.startFadeOut(alert.id), 3200);
        }
      });
    });
  }

  startFadeOut(id: string): void {
    this.fadingAlerts.update(set => {
      const newSet = new Set(set);
      newSet.add(id);
      return newSet;
    });
    setTimeout(() => this.alertService.removeAlert(id), 300);
  }

  closeAlert(id: string): void {
    this.startFadeOut(id);
  }

  isFading(id: string): boolean {
    return this.fadingAlerts().has(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
      default: return 'ℹ';
    }
  }
}