import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in employees-wrapper">
      <!-- Toolbar -->
      <div class="employees-toolbar">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search employees by name, department, role..." 
            class="form-input search-input"
            (input)="onSearch($event)"
          />
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *ngIf="authService.userRole() === 'admin'">
          <span>➕</span> Add Employee
        </button>
      </div>

      <!-- Employees Cards Grid -->
      <div class="employees-grid">
        <div class="glass-card employee-card animate-fade-in" *ngFor="let emp of filteredEmployees()">
          <div class="emp-card-header">
            <div class="emp-avatar-wrapper">
              <span class="emp-avatar">{{ emp.name.charAt(0) }}</span>
            </div>
            
            <div class="emp-title-info">
              <h4 class="emp-name">{{ emp.name }}</h4>
              <span class="badge" [ngClass]="getRoleClass(emp.role)">
                {{ emp.role | uppercase }}
              </span>
            </div>
          </div>

          <div class="emp-card-body">
            <div class="emp-info-item">
              <span class="info-lbl">Email:</span>
              <span class="info-val">{{ emp.email }}</span>
            </div>
            <div class="emp-info-item">
              <span class="info-lbl">Department:</span>
              <span class="info-val">{{ emp.department || 'General Sales' }}</span>
            </div>
            
            <!-- Performance Indicator Bar -->
            <div class="performance-bar-section">
              <div class="performance-header">
                <span class="info-lbl">Performance Index:</span>
                <span class="performance-score font-bold">{{ emp.performance || 80 }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-bar" [style.width.%]="emp.performance || 80"></div>
              </div>
            </div>
          </div>

          <div class="emp-card-actions" *ngIf="authService.userRole() === 'admin'">
            <button class="btn btn-secondary btn-sm" (click)="openEditModal(emp)">✏️ Edit</button>
            <button class="btn btn-secondary btn-sm btn-delete-emp" (click)="onDeleteEmployee(emp.id)">🗑️ Remove</button>
          </div>
        </div>

        <div class="empty-employees glass-card" *ngIf="filteredEmployees().length === 0">
          No employees found matching the filters.
        </div>
      </div>

      <!-- Add/Edit Employee Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showModal()">
        <div class="modal-card glass-card">
          <div class="modal-header-premium">
            <div class="modal-header-icon-title">
              <div class="modal-icon-badge badge-blue">👥</div>
              <div class="modal-title-stack">
                <h3 class="modal-title-text">{{ isEditMode() ? 'Edit Employee Profile' : 'Register New Employee' }}</h3>
                <p class="modal-subtitle-text">Manage employee payroll profile, department roles & access rights</p>
              </div>
            </div>
            <button class="close-btn-premium" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="empForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="name" class="form-label">Full Name *</label>
              <input type="text" id="name" formControlName="name" class="form-input" placeholder="Rahul Employee" />
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Corporate Email Address *</label>
              <input type="email" id="email" formControlName="email" class="form-input" placeholder="rahul&#64;crm.com" [readonly]="isEditMode()" />
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label for="department" class="form-label">Department Name *</label>
                <input type="text" id="department" formControlName="department" class="form-input" placeholder="Sales Executive" />
              </div>
              <div class="form-group col-6">
                <label for="performance" class="form-label">Initial Performance Index (0-100)</label>
                <input type="number" id="performance" formControlName="performance" class="form-input" min="0" max="100" />
              </div>
            </div>

            <div class="form-group">
              <label for="role" class="form-label">System Security Access Role *</label>
              <select id="role" formControlName="role" class="form-input">
                <option value="employee">Employee (Sales Representative)</option>
                <option value="manager">Manager (Sales & Reports view)</option>
                <option value="admin">Super Admin (Full permission)</option>
              </select>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="empForm.invalid">
                {{ isEditMode() ? 'Save Changes' : 'Create Profile' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .employees-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .employees-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .search-box {
      flex: 1;
      max-width: 480px;
    }

    .search-input {
      height: 42px;
    }

    .employees-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .employee-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 1.5rem;
    }

    .emp-card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }

    .emp-avatar-wrapper {
      flex-shrink: 0;
    }

    .emp-avatar {
      width: 46px;
      height: 46px;
      border-radius: var(--border-radius-full);
      background: var(--primary-light);
      color: var(--primary);
      font-size: 1.25rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
    }

    .emp-title-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .emp-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .emp-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .emp-info-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.825rem;
    }

    .info-lbl {
      color: var(--text-muted);
      font-weight: 500;
    }

    .info-val {
      color: var(--text-main);
      font-weight: 600;
    }

    .performance-bar-section {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-top: 0.5rem;
    }

    .performance-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .progress-track {
      height: 8px;
      background: var(--border-color);
      border-radius: var(--border-radius-full);
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: var(--border-radius-full);
    }

    .emp-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      border-top: 1px solid var(--border-color);
      padding-top: 0.75rem;
    }

    .btn-sm {
      padding: 0.4rem 0.8rem;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .btn-delete-emp:hover {
      background: var(--error-light);
      color: var(--error);
      border-color: transparent;
    }

    .empty-employees {
      grid-column: span 3;
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
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
      max-width: 500px;
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
      gap: 1rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .col-6 {
      flex: 1;
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
export class EmployeesComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  employees = signal<any[]>([]);
  searchQuery = signal('');

  showModal = signal(false);
  isEditMode = signal(false);
  activeEmployeeId = signal<number | null>(null);

  empForm: FormGroup;

  constructor() {
    this.empForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      department: ['Sales Representative', Validators.required],
      performance: [85, [Validators.min(0), Validators.max(100)]],
      role: ['employee', Validators.required]
    });
  }

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.api.getEmployees().subscribe(data => {
      this.employees.set(data);
    });
  }

  filteredEmployees() {
    const q = this.searchQuery().toLowerCase();
    return this.employees().filter(e => {
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        e.role.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      );
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
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
    this.isEditMode.set(false);
    this.activeEmployeeId.set(null);
    this.empForm.reset({ performance: 80, role: 'employee', department: 'Sales Representative' });
    this.showModal.set(true);
  }

  openEditModal(emp: any) {
    this.isEditMode.set(true);
    this.activeEmployeeId.set(emp.id);
    this.empForm.patchValue({
      name: emp.name,
      email: emp.email,
      department: emp.department,
      performance: emp.performance,
      role: emp.role
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.empForm.invalid) return;
    const payload = this.empForm.value;

    if (this.isEditMode()) {
      const id = this.activeEmployeeId();
      if (id) {
        this.api.updateEmployee(id, payload).subscribe(() => {
          this.loadEmployees();
          this.closeModal();
        });
      }
    } else {
      this.api.createEmployee(payload).subscribe(() => {
        this.loadEmployees();
        this.closeModal();
      });
    }
  }

  onDeleteEmployee(id: number) {
    if (confirm('Are you sure you want to remove this employee and block their user account?')) {
      this.api.deleteEmployee(id).subscribe(() => {
        this.loadEmployees();
      });
    }
  }
}
