import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-glass-card animate-fade-in">
        <div class="login-header">
          <div class="logo-circle">
            <span class="logo-inner">CRM</span>
          </div>
          <h1 class="login-title">Enterprise CRM</h1>
          <p class="login-subtitle">Sign in to manage customers, leads and tasks</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-input" 
              placeholder="e.g. admin@crm.com"
              [class.input-error]="isFieldInvalid('email')"
            />
            <div *ngIf="isFieldInvalid('email')" class="error-msg">
              Please enter a valid email address.
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <div class="password-wrapper">
              <input 
                [type]="showPassword() ? 'text' : 'password'" 
                id="password" 
                formControlName="password" 
                class="form-input" 
                placeholder="••••••••"
                [class.input-error]="isFieldInvalid('password')"
              />
              <button 
                type="button" 
                class="toggle-pwd-btn" 
                (click)="togglePasswordVisibility()"
              >
                {{ showPassword() ? '👁️' : '🙈' }}
              </button>
            </div>
            <div *ngIf="isFieldInvalid('password')" class="error-msg">
              Password must be at least 6 characters.
            </div>
          </div>

          <div *ngIf="loginError()" class="alert-error animate-fade-in">
            {{ loginError() }}
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            [disabled]="loginForm.invalid || isLoading()"
          >
            <span *ngIf="isLoading()" class="spinner"></span>
            <span>{{ isLoading() ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <div class="login-footer">
          <p>Demo Login Details:</p>
          <div class="demo-creds">
            <div><strong>Admin:</strong> admin&#64;crm.com / admin123</div>
            <div><strong>Manager:</strong> manager&#64;crm.com / manager123</div>
            <div><strong>Employee:</strong> employee&#64;crm.com / employee123</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100vw;
      background: radial-gradient(circle at top right, hsla(220, 85%, 65%, 0.15) 0%, transparent 40%),
                  radial-gradient(circle at bottom left, hsla(260, 75%, 60%, 0.15) 0%, transparent 40%),
                  var(--bg-gradient);
      padding: 1.5rem;
    }

    .login-glass-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 3rem 2.5rem;
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      text-align: center;
    }

    .login-header {
      margin-bottom: 2rem;
    }

    .logo-circle {
      width: 60px;
      height: 60px;
      border-radius: var(--border-radius-full);
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem auto;
      box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
    }

    .logo-inner {
      color: #ffffff;
      font-weight: 800;
      font-size: 1.2rem;
      letter-spacing: -0.05em;
    }

    .login-title {
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      color: var(--text-main);
      margin-bottom: 0.5rem;
    }

    .login-subtitle {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .login-form {
      text-align: left;
    }

    .password-wrapper {
      position: relative;
    }

    .toggle-pwd-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .toggle-pwd-btn:hover {
      opacity: 1;
    }

    .input-error {
      border-color: var(--error) !important;
    }

    .error-msg {
      color: var(--error);
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }

    .alert-error {
      background: var(--error-light);
      border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--error);
      padding: 0.75rem 1rem;
      border-radius: var(--border-radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 1.25rem;
    }

    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
      height: 48px;
    }

    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 3px solid #ffffff;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .login-footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .demo-creds {
      background: rgba(0, 0, 0, 0.02);
      border: 1px dashed var(--border-color);
      padding: 0.75rem;
      border-radius: var(--border-radius-sm);
      margin-top: 0.5rem;
      text-align: left;
      font-family: monospace;
    }
    
    [data-theme="dark"] .demo-creds {
      background: rgba(255, 255, 255, 0.02);
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  loginError = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.loginError.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loginError.set(
          err.error?.message || 'Invalid email or password. Please try again.'
        );
      }
    });
  }
}
