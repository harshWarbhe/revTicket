import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../core/services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private alertService = inject(AlertService);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  error = signal('');
  showPassword = signal(false);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user?.role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/user/home']);
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const credentials = {
      email: this.loginForm.value.email!.trim(),
      password: this.loginForm.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.alertService.success('Login successful! Welcome back.');

        setTimeout(() => {
          const redirectUrl = this.authService.getRedirectUrl();
          if (redirectUrl) {
            this.authService.clearRedirectUrl();
            this.router.navigateByUrl(redirectUrl);
            return;
          }

          if (response.user.role === 'ADMIN') {
            this.router.navigate(['/admin/dashboard']);
          } else {
            this.router.navigate(['/user/home']);
          }
        }, 0);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Invalid email or password. Please try again.');
      }
    });
  }

  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.hasError(errorType) && field.touched);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  loginWithGoogle(): void {
    const clientId = '21826531648-9ai38efgotj5f76lvf29kgqn1toenr20.apps.googleusercontent.com';
    const redirectUri = 'http://localhost:4200/auth/login';
    const scope = 'email profile';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent(scope)}&` +
      `prompt=select_account`;
    
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      authUrl,
      'Google Sign-In',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    const checkPopup = setInterval(() => {
      try {
        if (popup && popup.location.href.includes('access_token')) {
          const hash = popup.location.hash;
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          
          if (accessToken) {
            clearInterval(checkPopup);
            popup.close();
            this.fetchGoogleUserInfo(accessToken);
          }
        }
      } catch (e) {
        // Cross-origin error - popup still on Google domain
      }
      
      if (popup && popup.closed) {
        clearInterval(checkPopup);
        this.alertService.error('Google Sign-In cancelled');
      }
    }, 500);
  }

  private fetchGoogleUserInfo(accessToken: string): void {
    this.loading.set(true);
    
    fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`)
      .then(response => response.json())
      .then(userInfo => {
        const oauth2Request = {
          token: accessToken,
          provider: 'google',
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        };
        
        this.authService.oauth2Login(oauth2Request).subscribe({
          next: (authResponse) => {
            this.loading.set(false);
            this.alertService.success('Welcome! Logged in with Google.');
            
            setTimeout(() => {
              if (authResponse.user.role === 'ADMIN') {
                this.router.navigate(['/admin/dashboard']);
              } else {
                this.router.navigate(['/user/home']);
              }
            }, 0);
          },
          error: (err) => {
            this.loading.set(false);
            this.error.set('Google login failed. Please try again.');
          }
        });
      })
      .catch(error => {
        this.loading.set(false);
        this.alertService.error('Failed to get Google user info');
      });
  }
}
