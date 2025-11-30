import { Component, OnInit, signal } from '@angular/core';
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
  user = signal<User | null>(null);
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  activeTab = signal('personal');
  loading = signal(false);
  loadingProfile = signal(true);
  avatarPreview = signal<string>('');

  availableGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Adventure', 'Animation', 'Documentary'];
  
  preferences = signal<{
    language: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  }>({
    language: 'english',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

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
    this.loadingProfile.set(true);
    this.userService.getUserProfile().subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.profileForm.patchValue({
          name: userData.name,
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || '',
          address: userData.address || ''
        });
        this.preferences.set({
          language: userData.preferredLanguage || 'english',
          emailNotifications: userData.emailNotifications !== false,
          smsNotifications: userData.smsNotifications === true,
          pushNotifications: userData.pushNotifications !== false
        });
        this.loadingProfile.set(false);
      },
      error: (err) => {
        console.error('Profile load error:', err);
        this.alertService.error('Failed to load profile data. Please check if backend is running.');
        this.loadingProfile.set(false);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/users/default-avatar.svg';
  }

  changeAvatar(): void {
    this.alertService.info('Avatar upload feature coming soon!');
  }

  previewAvatar(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.avatarPreview.set(result);
      };
      reader.readAsDataURL(file);
    }
  }

  isImage(url: string): boolean {
    return /\.(png|jpg|jpeg|webp|svg|gif)$/i.test(url) || url.startsWith('data:image');
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.alertService.error('Please fill in all required fields correctly');
      return;
    }

    this.loading.set(true);
    const profileData = {
      name: this.profileForm.get('name')?.value,
      phone: this.profileForm.get('phone')?.value || null,
      dateOfBirth: this.profileForm.get('dateOfBirth')?.value || null,
      gender: this.profileForm.get('gender')?.value || null,
      address: this.profileForm.get('address')?.value || null
    };

    this.userService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.alertService.success('Profile updated successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.alertService.error('Failed to update profile. Please try again.');
        this.loading.set(false);
      }
    });
  }

  updatePreferences(): void {
    this.loading.set(true);
    const prefs = this.preferences();
    const preferencesData = {
      preferredLanguage: prefs.language,
      emailNotifications: prefs.emailNotifications,
      smsNotifications: prefs.smsNotifications,
      pushNotifications: prefs.pushNotifications
    };

    this.userService.updateProfile(preferencesData).subscribe({
      next: () => {
        this.alertService.success('Preferences updated successfully!');
        this.loading.set(false);
      },
      error: () => {
        this.alertService.error('Failed to update preferences');
        this.loading.set(false);
      }
    });
  }

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update(v => !v);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  getPasswordStrength(): string {
    const password = this.passwordForm.get('newPassword')?.value || '';
    if (password.length === 0) return '';
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    if (strength === 'weak') return 'Weak';
    if (strength === 'medium') return 'Medium';
    if (strength === 'strong') return 'Strong';
    return '';
  }

  hasUpperCase(): boolean {
    return /[A-Z]/.test(this.passwordForm.get('newPassword')?.value || '');
  }

  hasLowerCase(): boolean {
    return /[a-z]/.test(this.passwordForm.get('newPassword')?.value || '');
  }

  hasNumber(): boolean {
    return /\d/.test(this.passwordForm.get('newPassword')?.value || '');
  }

  passwordsMatch(): boolean {
    const newPass = this.passwordForm.get('newPassword')?.value;
    const confirmPass = this.passwordForm.get('confirmPassword')?.value;
    return newPass && confirmPass && newPass === confirmPass;
  }

  resetPasswordForm(): void {
    this.passwordForm.reset();
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
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

    this.loading.set(true);
    this.userService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.alertService.success('Password changed successfully!');
        this.resetPasswordForm();
        this.loading.set(false);
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.error || 'Failed to change password';
        this.alertService.error(errorMsg);
        this.loading.set(false);
      }
    });
  }

  updateLanguage(language: string): void {
    this.preferences.update(p => ({ ...p, language }));
  }

  updateEmailNotifications(value: boolean): void {
    this.preferences.update(p => ({ ...p, emailNotifications: value }));
  }

  updateSmsNotifications(value: boolean): void {
    this.preferences.update(p => ({ ...p, smsNotifications: value }));
  }

  updatePushNotifications(value: boolean): void {
    this.preferences.update(p => ({ ...p, pushNotifications: value }));
  }

  get displayName(): string {
    return this.user()?.name || 'User';
  }

  get displayEmail(): string {
    return this.user()?.email || '';
  }

  get memberSince(): Date {
    return this.user()?.createdAt || new Date();
  }
}
