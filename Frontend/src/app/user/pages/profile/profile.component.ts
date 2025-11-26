import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../core/services/alert.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  activeTab = 'personal';
  loading = false;
  loadingProfile = true;

  availableGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Adventure', 'Animation', 'Documentary'];
  
  preferences = {
    language: 'english',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  };

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
  }

  initializeForms(): void {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      dateOfBirth: [''],
      gender: [''],
      address: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  loadUserData(): void {
    this.loadingProfile = true;
    this.userService.getUserProfile().subscribe({
      next: (userData) => {
        this.user = userData;
        this.profileForm.patchValue({
          name: userData.name,
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || '',
          address: userData.address || ''
        });
        this.preferences = {
          language: userData.preferredLanguage || 'english',
          emailNotifications: userData.emailNotifications !== false,
          smsNotifications: userData.smsNotifications === true,
          pushNotifications: userData.pushNotifications !== false
        };
        this.loadingProfile = false;
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.alertService.error('Failed to load profile data');
        this.loadingProfile = false;
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/users/default-avatar.svg';
  }

  changeAvatar(): void {
    this.alertService.info('Avatar upload feature coming soon!');
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.alertService.error('Please fill in all required fields correctly');
      return;
    }

    this.loading = true;
    const profileData = {
      name: this.profileForm.get('name')?.value,
      phone: this.profileForm.get('phone')?.value || null,
      dateOfBirth: this.profileForm.get('dateOfBirth')?.value || null,
      gender: this.profileForm.get('gender')?.value || null,
      address: this.profileForm.get('address')?.value || null
    };

    this.userService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.alertService.success('Profile updated successfully!');
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        this.alertService.error('Failed to update profile. Please try again.');
        this.loading = false;
      }
    });
  }

  updatePreferences(): void {
    this.loading = true;
    const preferencesData = {
      preferredLanguage: this.preferences.language,
      emailNotifications: this.preferences.emailNotifications,
      smsNotifications: this.preferences.smsNotifications,
      pushNotifications: this.preferences.pushNotifications
    };

    this.userService.updateProfile(preferencesData).subscribe({
      next: () => {
        this.alertService.success('Preferences updated successfully!');
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to update preferences:', err);
        this.alertService.error('Failed to update preferences');
        this.loading = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.alertService.error('Please fill in all password fields');
      return;
    }

    const currentPassword = this.passwordForm.get('currentPassword')?.value;
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      this.alertService.error('New passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      this.alertService.error('Password must be at least 6 characters long');
      return;
    }

    this.loading = true;
    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.alertService.success('Password changed successfully!');
        this.passwordForm.reset();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to change password:', err);
        const errorMsg = err.error?.message || err.error || 'Failed to change password';
        this.alertService.error(errorMsg);
        this.loading = false;
      }
    });
  }

  get displayName(): string {
    return this.user?.name || 'User';
  }

  get displayEmail(): string {
    return this.user?.email || '';
  }

  get memberSince(): Date {
    return this.user?.createdAt || new Date();
  }
}
