import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in users-wrapper" *ngIf="authService.userRole() === 'admin'; else accessDenied">
      <!-- Toolbar -->
      <div class="users-toolbar">
        <h3 class="toolbar-title">User Security Credentials</h3>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>➕</span> Add User Login
        </button>
      </div>

      <!-- Users Grid Table -->
      <div class="glass-card table-card">
        <div class="table-responsive">
          <table class="crm-table">
            <thead>
              <tr>
                <th>User Account Name</th>
                <th>Login Email (Username)</th>
                <th>Access Level Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let usr of users()">
                <td><strong>{{ usr.name }}</strong></td>
                <td>{{ usr.email }}</td>
                <td>
                  <span class="badge" [ngClass]="getRoleClass(usr.role)">
                    {{ usr.role | uppercase }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <!-- Don't allow admin to delete themselves (usually user ID 1 is seed admin) -->
                    <button 
                      class="action-btn delete-btn" 
                      (click)="onDeleteUser(usr.id)"
                      *ngIf="usr.id !== 1"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="users().length === 0">
                <td colspan="4" class="empty-table-msg">No user logins found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add User Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showModal()">
        <div class="modal-card glass-card">
          <div class="modal-header-premium">
            <div class="modal-header-icon-title">
              <div class="modal-icon-badge badge-purple">🔐</div>
              <div class="modal-title-stack">
                <h3 class="modal-title-text">Register New User Login</h3>
                <p class="modal-subtitle-text">Create system access profiles, logins, and set user roles</p>
              </div>
            </div>
            <button class="close-btn-premium" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="name" class="form-label">Full Name *</label>
              <input type="text" id="name" formControlName="name" class="form-input" placeholder="Super Admin" />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email Address *</label>
              <input type="email" id="email" formControlName="email" class="form-input" placeholder="admin&#64;crm.com" />
            </div>

            <div class="form-group">
              <label for="password" class="form-label">Password *</label>
              <input type="password" id="password" formControlName="password" class="form-input" placeholder="••••••••" />
            </div>

            <div class="form-group">
              <label for="role" class="form-label">Security Role *</label>
              <select id="role" formControlName="role" class="form-input">
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Access Denied template -->
    <ng-template #accessDenied>
      <div class="glass-card error-card animate-fade-in" style="padding: 3rem; text-align: center;">
        <h2 style="color: var(--error);">⚠️ Access Denied</h2>
        <p class="text-muted" style="margin-top: 1rem;">
          You do not have administrative privileges to manage user login profiles.
        </p>
      </div>
    </ng-template>
  `,
  styles: [`
    .users-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .users-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .toolbar-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .table-card {
      padding: 0.5rem;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      background: none;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--border-radius-sm);
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: var(--border-color);
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }

    .modal-card {
      width: 100%;
      max-width: 480px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }

    .modal-header h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--text-muted);
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid var(--border-color);
      padding-top: 1rem;
      margin-top: 1rem;
    }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  users = signal<any[]>([]);
  showModal = signal(false);
  userForm: FormGroup;

  constructor() {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['employee', Validators.required]
    });
  }

  ngOnInit() {
    if (this.authService.userRole() === 'admin') {
      this.loadUsers();
    }
  }

  loadUsers() {
    this.api.getUsers().subscribe(data => {
      this.users.set(data);
    });
  }

  getRoleClass(role: string): string {
    switch (role) {
      case 'admin': return 'badge-error';
      case 'manager': return 'badge-warning';
      case 'employee': return 'badge-info';
      default: return 'badge-info';
    }
  }

  openAddModal() {
    this.userForm.reset({ role: 'employee' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.api.createUser(this.userForm.value).subscribe(() => {
      this.loadUsers();
      this.closeModal();
    });
  }

  onDeleteUser(id: number) {
    if (confirm('Are you sure you want to block and delete this user profile?')) {
      this.api.deleteUser(id).subscribe(() => {
        this.loadUsers();
      });
    }
  }
}
