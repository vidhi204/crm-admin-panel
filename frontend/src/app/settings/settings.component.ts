import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../auth/auth.service';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in settings-wrapper">
      <div class="settings-grid">
        <!-- Profile info (View Only / Summary) -->
        <div class="glass-card settings-card">
          <h3 class="settings-section-title">User Profile</h3>
          <div class="profile-summary">
            <div class="summary-avatar">
              {{ authService.currentUser()?.name?.charAt(0) || 'U' }}
            </div>
            <div class="summary-details">
              <h4>{{ authService.currentUser()?.name }}</h4>
              <p class="role-lbl">Access level: {{ authService.currentUser()?.role | uppercase }}</p>
              <p class="email-lbl">{{ authService.currentUser()?.email }}</p>
            </div>
          </div>

          <div style="margin-top: 2rem;">
            <h4 class="settings-sub-title">System Theme Preference</h4>
            <div class="theme-options">
              <button 
                class="btn theme-btn" 
                [class.btn-primary]="themeService.theme() === 'light'" 
                [class.btn-secondary]="themeService.theme() !== 'light'"
                (click)="themeService.setTheme('light')"
              >
                ☀️ Light Mode
              </button>
              <button 
                class="btn theme-btn" 
                [class.btn-primary]="themeService.theme() === 'dark'" 
                [class.btn-secondary]="themeService.theme() !== 'dark'"
                (click)="themeService.setTheme('dark')"
              >
                🌙 Dark Mode
              </button>
            </div>
          </div>
        </div>

        <!-- Corporate Settings (Admin Only) -->
        <div class="glass-card settings-card" *ngIf="authService.userRole() === 'admin'">
          <h3 class="settings-section-title">Corporate Settings (Admin)</h3>

          <form [formGroup]="settingsForm" (ngSubmit)="onSubmit()" class="settings-form">
            <div class="form-group">
              <label for="companyName" class="form-label">Company Name *</label>
              <input type="text" id="companyName" formControlName="companyName" class="form-input" />
            </div>

            <div class="form-group">
              <label for="emailSettings" class="form-label">SMTP Email SMTP Gateway *</label>
              <input type="text" id="emailSettings" formControlName="emailSettings" class="form-input" />
            </div>

            <div class="form-group">
              <label for="smsSettings" class="form-label">SMS Gateway API Server *</label>
              <input type="text" id="smsSettings" formControlName="smsSettings" class="form-input" />
            </div>

            <div class="notifications-toggles">
              <h4 class="settings-sub-title">Email Notifications Triggers</h4>
              
              <div class="toggle-group" formGroupName="notifications">
                <label class="toggle-item">
                  <input type="checkbox" formControlName="newLead" />
                  <span>Notify on New Lead Generated</span>
                </label>
                
                <label class="toggle-item">
                  <input type="checkbox" formControlName="followUpReminder" />
                  <span>Send Follow-up Reminders</span>
                </label>
                
                <label class="toggle-item">
                  <input type="checkbox" formControlName="taskReminder" />
                  <span>Send Task Deadlines Alerts</span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="settingsForm.invalid || isSaving()">
                {{ isSaving() ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Employee Info Card (Non-Admin View) -->
        <div class="glass-card settings-card" *ngIf="authService.userRole() !== 'admin'">
          <h3 class="settings-section-title">Corporate Info</h3>
          <p class="company-desc">
            You are logged into the Enterprise CRM system of <strong>{{ companyName() }}</strong>.
          </p>
          <div class="company-meta-list">
            <div class="meta-item">
              <span class="lbl">Email Server:</span>
              <span class="val">{{ emailGateway() }}</span>
            </div>
            <div class="meta-item">
              <span class="lbl">SMS Server:</span>
              <span class="val">{{ smsGateway() }}</span>
            </div>
          </div>
          <p class="note-box text-muted">
            ⚠️ Standard users do not have permissions to edit corporate settings. Please contact the administrator for adjustments.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }
    }

    .settings-card {
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .settings-section-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
    }

    .settings-sub-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .profile-summary {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .summary-avatar {
      width: 60px;
      height: 60px;
      border-radius: var(--border-radius-full);
      background: var(--primary);
      color: white;
      font-size: 1.75rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .summary-details h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .role-lbl {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
    }

    .email-lbl {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .theme-options {
      display: flex;
      gap: 0.75rem;
    }

    .theme-btn {
      flex: 1;
      height: 44px;
    }

    .settings-form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .notifications-toggles {
      border-top: 1px dashed var(--border-color);
      padding-top: 1.25rem;
    }

    .toggle-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-main);
      cursor: pointer;
    }

    .toggle-item input {
      width: 18px;
      height: 18px;
      accent-color: var(--primary);
      cursor: pointer;
    }

    .form-actions {
      border-top: 1px solid var(--border-color);
      padding-top: 1.25rem;
      display: flex;
      justify-content: flex-end;
    }

    /* Non Admin Style */
    .company-desc {
      font-size: 0.95rem;
      color: var(--text-main);
    }

    .company-meta-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: rgba(0, 0, 0, 0.02);
      border: 1px solid var(--border-color);
      padding: 1rem;
      border-radius: var(--border-radius-sm);
    }

    [data-theme="dark"] .company-meta-list {
      background: rgba(255, 255, 255, 0.02);
    }

    .company-meta-list .meta-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }

    .company-meta-list .lbl {
      color: var(--text-muted);
      font-weight: 500;
    }

    .company-meta-list .val {
      color: var(--text-main);
      font-weight: 600;
    }

    .note-box {
      font-size: 0.8rem;
      padding: 0.75rem;
      border-left: 3px solid var(--warning);
      background: var(--warning-light);
      border-radius: 4px;
    }
  `]
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private fb = inject(FormBuilder);

  isSaving = signal(false);
  companyName = signal('');
  emailGateway = signal('');
  smsGateway = signal('');

  settingsForm: FormGroup;

  constructor() {
    this.settingsForm = this.fb.group({
      companyName: ['', Validators.required],
      emailSettings: ['', Validators.required],
      smsSettings: ['', Validators.required],
      notifications: this.fb.group({
        newLead: [true],
        followUpReminder: [true],
        taskReminder: [true]
      })
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.api.getSettings().subscribe(data => {
      this.companyName.set(data.companyName);
      this.emailGateway.set(data.emailSettings);
      this.smsGateway.set(data.smsSettings);

      this.settingsForm.patchValue({
        companyName: data.companyName,
        emailSettings: data.emailSettings,
        smsSettings: data.smsSettings,
        notifications: {
          newLead: data.notifications?.newLead,
          followUpReminder: data.notifications?.followUpReminder,
          taskReminder: data.notifications?.taskReminder
        }
      });
    });
  }

  onSubmit() {
    if (this.settingsForm.invalid) return;
    this.isSaving.set(true);

    this.api.updateSettings(this.settingsForm.value).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.companyName.set(updated.companyName);
        this.emailGateway.set(updated.emailSettings);
        this.smsGateway.set(updated.smsSettings);
        alert('Settings saved successfully!');
      },
      error: () => {
        this.isSaving.set(false);
        alert('Failed to save settings.');
      }
    });
  }
}
