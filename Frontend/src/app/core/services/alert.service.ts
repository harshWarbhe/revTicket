import { Injectable, signal } from '@angular/core';

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  autoClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private alertsSignal = signal<Alert[]>([]);
  public alerts = this.alertsSignal.asReadonly();
  private alertCounter = 0;

  success(message: string, autoClose = true): void {
    this.addAlert('success', message, autoClose);
  }

  error(message: string, autoClose = true): void {
    this.addAlert('error', message, autoClose);
  }

  warning(message: string, autoClose = true): void {
    this.addAlert('warning', message, autoClose);
  }

  info(message: string, autoClose = true): void {
    this.addAlert('info', message, autoClose);
  }

  private addAlert(type: Alert['type'], message: string, autoClose: boolean): void {
    const alert: Alert = {
      id: `${Date.now()}-${++this.alertCounter}`,
      type,
      message,
      autoClose
    };

    this.alertsSignal.update(alerts => [...alerts, alert]);

    if (autoClose) {
      setTimeout(() => this.removeAlert(alert.id), 3500);
    }
  }

  removeAlert(id: string): void {
    this.alertsSignal.update(alerts => alerts.filter(alert => alert.id !== id));
  }

  clear(): void {
    this.alertsSignal.set([]);
  }
}