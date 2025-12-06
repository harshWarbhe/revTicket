import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { AlertService } from '../../../core/services/alert.service';
import { User, UserBooking } from '../../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  private adminUserService = inject(AdminUserService);
  private alertService = inject(AlertService);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  roleFilter = signal<string>('ALL');
  statusFilter = signal<string>('ALL');
  sortBy = signal<string>('name');
  sortOrder = signal<'asc' | 'desc'>('asc');
  
  selectedUser = signal<User | null>(null);
  userBookings = signal<UserBooking[]>([]);
  showViewModal = signal(false);
  loadingBookings = signal(false);
  updatingRoleId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.adminUserService.getAllUsers().subscribe({
      next: (users) => {
        const sorted = (users || []).sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.users.set(sorted);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load users:', err);
        this.alertService.error('Failed to load users. Please try again.');
        this.users.set([]);
        this.filteredUsers.set([]);
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.users()];

    const term = this.searchTerm().toLowerCase().trim();
    if (term) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.toLowerCase().includes(term)
      );
    }

    if (this.roleFilter() !== 'ALL') {
      filtered = filtered.filter(user => user.role === this.roleFilter());
    }

    if (this.statusFilter() !== 'ALL') {
      const isActive = this.statusFilter() === 'ACTIVE';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (this.sortBy()) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return this.sortOrder() === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortOrder() === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredUsers.set(filtered);
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.applyFilters();
  }

  onRoleFilterChange(role: string): void {
    this.roleFilter.set(role);
    this.applyFilters();
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.applyFilters();
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy() === sortBy) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortBy);
      this.sortOrder.set('asc');
    }
    this.applyFilters();
  }

  viewUser(user: User): void {
    this.selectedUser.set(user);
    this.showViewModal.set(true);
    this.loadUserBookings(user.id);
  }

  loadUserBookings(userId: string): void {
    this.loadingBookings.set(true);
    this.adminUserService.getUserBookings(userId).subscribe({
      next: (bookings) => {
        this.userBookings.set(bookings);
        this.loadingBookings.set(false);
      },
      error: () => {
        this.alertService.error('Failed to load user bookings');
        this.loadingBookings.set(false);
      }
    });
  }

  changeUserRole(user: User, newRole: string): void {
    if (user.role === newRole) return;
    
    const role = newRole as 'USER' | 'ADMIN';
    this.updatingRoleId.set(user.id);
    this.adminUserService.updateUserRole(user.id, newRole).subscribe({
      next: () => {
        this.alertService.success(`Role updated to ${newRole}`);
        this.users.update(users => users.map(u => u.id === user.id ? { ...u, role } : u));
        this.applyFilters();
        this.updatingRoleId.set(null);
      },
      error: (err) => {
        console.error('Update role error:', err);
        this.alertService.error('Failed to update user role');
        this.updatingRoleId.set(null);
      }
    });
  }

  toggleUserStatus(user: User): void {
    const newStatus = user.isActive ? 'BLOCKED' : 'ACTIVE';
    const action = user.isActive ? 'blocked' : 'activated';
    
    this.adminUserService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.alertService.success(`User ${action} successfully`);
        this.users.update(users => users.map(u => u.id === user.id ? { ...u, isActive: !user.isActive } : u));
        this.applyFilters();
      },
      error: (err) => {
        console.error('Update status error:', err);
        this.alertService.error(`Failed to ${action.replace('ed', '')} user`);
      }
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete "${user.name}"?\n\nThis action cannot be undone and will remove all user data.`)) return;

    this.adminUserService.deleteUser(user.id).subscribe({
      next: () => {
        this.alertService.success(`"${user.name}" deleted successfully`);
        this.users.update(users => users.filter(u => u.id !== user.id));
        this.applyFilters();
      },
      error: (err) => {
        console.error('Delete user error:', err);
        this.alertService.error('Failed to delete user. User may have active bookings.');
      }
    });
  }

  closeModal(): void {
    this.showViewModal.set(false);
    this.selectedUser.set(null);
    this.userBookings.set([]);
  }

  getStatusClass(user: User): string {
    return user.isActive !== false ? 'active' : 'blocked';
  }

  getRoleClass(role: string): string {
    return role === 'ADMIN' ? 'admin' : 'user';
  }
}
