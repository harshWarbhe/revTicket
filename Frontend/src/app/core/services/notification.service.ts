import { Injectable, signal } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private client: Client | null = null;
  private notifications = signal<Notification[]>([]);
  private connected = signal(false);

  readonly allNotifications = this.notifications.asReadonly();
  readonly unreadCount = signal(0);

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    this.client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.connected.set(true);
      this.subscribeToTopics();
    };

    this.client.onDisconnect = () => {
      this.connected.set(false);
    };

    this.client.activate();
  }

  private subscribeToTopics() {
    const client = this.client;
    if (!client) return;
    
    // Admin notifications
    client.subscribe('/topic/admin/reviews', (message) => {
      this.addNotification(message.body, 'info');
    });

    // General notifications
    client.subscribe('/topic/reviews', (message) => {
      this.addNotification(message.body, 'success');
    });

    client.subscribe('/topic/bookings', (message) => {
      this.addNotification(message.body, 'info');
    });

    client.subscribe('/topic/maintenance', (message) => {
      this.addNotification(message.body, 'warning');
    });
  }

  private addNotification(message: string, type: Notification['type']) {
    const notification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
      read: false
    };

    this.notifications.update(notifications => [notification, ...notifications]);
    this.updateUnreadCount();
  }

  markAsRead(id: string) {
    this.notifications.update(notifications =>
      notifications.map(n => n.id === id ? { ...n, read: true } : n)
    );
    this.updateUnreadCount();
  }

  markAllAsRead() {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
    this.unreadCount.set(0);
  }

  clearAll() {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  private updateUnreadCount() {
    const unread = this.notifications().filter(n => !n.read).length;
    this.unreadCount.set(unread);
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}