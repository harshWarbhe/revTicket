import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resetPasswordForm!: FormGroup;
  loading = signal(false);
  error = signal('');
  token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    
    this.resetPasswordForm = this.fb.group({
      token: [this.token, [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    return password && confirmPassword && password.value === confirmPassword.value 
      ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.resetPasswordForm.valid) {
      this.loading.set(true);
      this.error.set('');
      
      const { token, newPassword } = this.resetPasswordForm.value;
      
      this.authService.resetPassword(token, newPassword).subscribe({
        next: () => {
          this.alertService.success('Password reset successfully');
          this.router.navigate(['/auth/login']);
        },
        error: (error) => {
          this.error.set('Failed to reset password. Please try again.');
          this.loading.set(false);
        }
      });
    }
  }
}