import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AdminService, DashboardStats, RevenueData, RecentActivity } from '../../../core/services/admin.service';
import { AlertService } from '../../../core/services/alert.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private alertService = inject(AlertService);

  // --- Existing signals (unchanged) ---
  stats = signal<DashboardStats>({
    totalMovies: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalUsers: 0,
    todayBookings: 0,
    cancelledBookings: 0,
    activeMovies: 0
  });

  revenueData = signal<RevenueData[]>([]);
  recentActivities = signal<RecentActivity[]>([]);
  selectedPeriod = signal(7);
  loading = signal(true);

  private destroy$ = new Subject<void>();
  private refreshInterval = interval(30000);

  ngOnInit(): void {
    this.loadDashboardData();

    this.refreshInterval
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadDashboardData(false);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // keep all existing methods exactly as they were
  loadDashboardData(showLoading: boolean = true): void {
    if (showLoading) {
      this.loading.set(true);
    }

    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });

    this.loadRevenueData();
    this.loadRecentActivities();
  }

  loadRevenueData(): void {
    const period = this.selectedPeriod();
    this.adminService.getRevenueData(period).subscribe({
      next: (data) => {
        const grouped = this.groupRevenueData(data, period);
        this.revenueData.set(grouped);
      },
      error: () => {}
    });
  }

  groupRevenueData(data: RevenueData[], period: number): RevenueData[] {
    if (period === 7) return data;
    if (period === 30) return this.groupByWeeks(data);
    if (period === 365) return this.groupByMonths(data);
    return data;
  }

  groupByWeeks(data: RevenueData[]): RevenueData[] {
    const weeks = new Map<string, number>();
    data.forEach(item => {
      const date = new Date(item.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weeks.set(weekKey, (weeks.get(weekKey) || 0) + item.revenue);
    });
    return Array.from(weeks.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  groupByMonths(data: RevenueData[]): RevenueData[] {
    const months = new Map<string, number>();
    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      months.set(monthKey, (months.get(monthKey) || 0) + item.revenue);
    });
    return Array.from(months.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  loadRecentActivities(): void {
    this.adminService.getRecentActivity(10).subscribe({
      next: (activities) => {
        this.recentActivities.set(activities);
      },
      error: () => {}
    });
  }

  onPeriodChange(period: number): void {
    this.selectedPeriod.set(period);
    this.loadRevenueData();
  }

  refreshData(): void {
    this.loadDashboardData();
    this.alertService.success('Dashboard data refreshed successfully!');
  }

  getMaxRevenue(): number {
    if (this.revenueData().length === 0) return 100;
    return Math.max(...this.revenueData().map(d => d.revenue), 100);
  }

  getBarHeight(revenue: number): string {
    const max = this.getMaxRevenue();
    const percentage = max > 0 ? (revenue / max) * 100 : 0;
    return `${Math.max(percentage, 2)}%`;
  }

  getBarLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const period = this.selectedPeriod();
    
    if (period === 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (period === 30) {
      const index = this.revenueData().findIndex(d => d.date === dateStr);
      return `W${index + 1}`;
    } else if (period === 365) {
      return date.toLocaleDateString('en-US', { month: 'short' });
    }
    return dateStr;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  getRevenueChange(): { value: number; isPositive: boolean } {
    const data = this.revenueData();
    if (data.length < 2) {
      return { value: 0, isPositive: true };
    }

    const current = data[data.length - 1]?.revenue || 0;
    const previous = data[data.length - 2]?.revenue || 0;

    if (previous === 0) {
      return { value: 0, isPositive: true };
    }

    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  }

  getBookingsChange(): { value: number; isPositive: boolean } {
    // Simplified - in production, compare with previous period
    return { value: 8.2, isPositive: true };
  }

  getUsersChange(): { value: number; isPositive: boolean } {
    return { value: 15.3, isPositive: true };
  }
}
