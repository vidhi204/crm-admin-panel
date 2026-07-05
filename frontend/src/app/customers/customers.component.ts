import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in customers-wrapper">
      <!-- Toolbar -->
      <div class="customers-toolbar">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search customers by name, company, email or address..." 
            class="form-input search-input"
            (input)="onSearch($event)"
          />
        </div>
        <button class="btn btn-primary" (click)="openAddModal()" *ngIf="authService.userRole() !== 'employee'">
          <span>➕</span> Add Customer
        </button>
      </div>

      <!-- Customers Data Grid -->
      <div class="glass-card table-card">
        <div class="table-responsive">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Company</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Location Address</th>
                <th *ngIf="authService.userRole() !== 'employee'">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let cust of filteredCustomers()" (click)="openViewModal(cust)" class="clickable-row">
                <td><strong>{{ cust.name }}</strong></td>
                <td>{{ cust.company || 'N/A' }}</td>
                <td>{{ cust.email }}</td>
                <td>{{ cust.phone || 'N/A' }}</td>
                <td>{{ cust.address || 'N/A' }}</td>
                <td *ngIf="authService.userRole() !== 'employee'" (click)="$event.stopPropagation()">
                  <div class="action-buttons">
                    <button class="action-btn edit-btn" (click)="openEditModal(cust)">✏️</button>
                    <button class="action-btn delete-btn" (click)="onDeleteCustomer(cust.id)" *ngIf="authService.userRole() === 'admin'">🗑️</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredCustomers().length === 0">
                <td [attr.colspan]="authService.userRole() === 'employee' ? 5 : 6" class="empty-table-msg">
                  No customers found matching the criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showFormModal()">
        <div class="modal-card glass-card">
          <div class="modal-header-premium">
            <div class="modal-header-icon-title">
              <div class="modal-icon-badge badge-blue">👥</div>
              <div class="modal-title-stack">
                <h3 class="modal-title-text">{{ isEditMode() ? 'Edit Customer' : 'Add New Customer' }}</h3>
                <p class="modal-subtitle-text">Record corporate account profiles and details</p>
              </div>
            </div>
            <button class="close-btn-premium" (click)="closeFormModal()">✕</button>
          </div>

          <form [formGroup]="customerForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group col-6">
                <label for="name" class="form-label">Full Name *</label>
                <input type="text" id="name" formControlName="name" class="form-input" placeholder="Sneha Gupta" />
              </div>
              <div class="form-group col-6">
                <label for="company" class="form-label">Company Name</label>
                <input type="text" id="company" formControlName="company" class="form-input" placeholder="Gupta & Sons" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label for="email" class="form-label">Email Address *</label>
                <input type="email" id="email" formControlName="email" class="form-input" placeholder="sneha&#64;guptas.com" />
              </div>
              <div class="form-group col-6">
                <label for="phone" class="form-label">Phone Number</label>
                <input type="text" id="phone" formControlName="phone" class="form-input" placeholder="9765432109" />
              </div>
            </div>

            <div class="form-group">
              <label for="address" class="form-label">Location Address</label>
              <input type="text" id="address" formControlName="address" class="form-input" placeholder="CG Road, Ahmedabad" />
            </div>

            <div class="form-group">
              <label for="history" class="form-label">Customer Relationship History / Interaction Logs</label>
              <textarea id="history" formControlName="history" class="form-input" rows="4" placeholder="Log interactions, packages bought, etc."></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeFormModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="customerForm.invalid">
                {{ isEditMode() ? 'Save Customer' : 'Add Customer' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- View Details Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showViewModal() && activeCustomer()">
        <div class="modal-card glass-card">
          <div class="modal-header-premium">
            <div class="modal-header-icon-title">
              <div class="modal-icon-badge badge-purple">👤</div>
              <div class="modal-title-stack">
                <h3 class="modal-title-text">Customer Profile Detail</h3>
                <p class="modal-subtitle-text">Consolidated CRM client logs & activity history</p>
              </div>
            </div>
            <button class="close-btn-premium" (click)="closeViewModal()">✕</button>
          </div>

          <div class="profile-details">
            <div class="profile-header-card">
              <div class="profile-avatar">
                {{ activeCustomer()?.name?.charAt(0) }}
              </div>
              <div class="profile-header-info">
                <h4>{{ activeCustomer()?.name }}</h4>
                <p>{{ activeCustomer()?.company || 'Individual Client' }}</p>
              </div>
            </div>

            <div class="profile-info-grid">
              <div class="info-block">
                <span class="info-label">EMAIL ADDRESS</span>
                <p class="info-value">{{ activeCustomer()?.email }}</p>
              </div>
              <div class="info-block">
                <span class="info-label">PHONE NUMBER</span>
                <p class="info-value">{{ activeCustomer()?.phone || 'N/A' }}</p>
              </div>
              <div class="info-block" style="grid-column: span 2;">
                <span class="info-label">PHYSICAL ADDRESS</span>
                <p class="info-value">{{ activeCustomer()?.address || 'N/A' }}</p>
              </div>
            </div>

            <div class="history-log-section">
              <h4 class="section-title">Interaction & Sales Log History</h4>
              <div class="history-content-box">
                {{ activeCustomer()?.history || 'No interaction records yet.' }}
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-primary" 
              *ngIf="authService.userRole() !== 'employee'"
              (click)="shiftFromViewToEdit()"
            >
              Edit Details
            </button>
            <button type="button" class="btn btn-secondary" (click)="closeViewModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .customers-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .customers-toolbar {
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

    .table-card {
      padding: 0.5rem;
    }

    .clickable-row {
      cursor: pointer;
      transition: background 0.2s;
    }

    .clickable-row:hover {
      background: rgba(59, 130, 246, 0.05) !important;
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
      max-width: 620px;
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
      font-size: 1.25rem;
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

    /* Profile View Layout */
    .profile-details {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .profile-header-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(59, 130, 246, 0.08);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-md);
    }

    .profile-avatar {
      width: 50px;
      height: 50px;
      border-radius: var(--border-radius-full);
      background: var(--primary);
      color: #ffffff;
      font-size: 1.5rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-header-info h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .profile-header-info p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .profile-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .info-block {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .info-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-main);
    }

    .history-log-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .history-content-box {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.02);
      border: 1px dashed var(--border-color);
      border-radius: var(--border-radius-sm);
      font-size: 0.85rem;
      color: var(--text-main);
      white-space: pre-line;
      max-height: 150px;
      overflow-y: auto;
    }

    [data-theme="dark"] .history-content-box {
      background: rgba(255, 255, 255, 0.02);
    }
  `]
})
export class CustomersComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  customers = signal<any[]>([]);
  searchQuery = signal('');

  showFormModal = signal(false);
  showViewModal = signal(false);
  isEditMode = signal(false);
  activeCustomerId = signal<number | null>(null);
  activeCustomer = signal<any | null>(null);

  customerForm: FormGroup;

  constructor() {
    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      company: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      history: ['']
    });
  }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.api.getCustomers().subscribe(data => {
      this.customers.set(data);
    });
  }

  filteredCustomers() {
    const q = this.searchQuery().toLowerCase();
    return this.customers().filter(c => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.activeCustomerId.set(null);
    this.customerForm.reset();
    this.showFormModal.set(true);
  }

  openEditModal(cust: any) {
    this.isEditMode.set(true);
    this.activeCustomerId.set(cust.id);
    this.customerForm.patchValue({
      name: cust.name,
      company: cust.company,
      email: cust.email,
      phone: cust.phone,
      address: cust.address,
      history: cust.history
    });
    this.showFormModal.set(true);
  }

  openViewModal(cust: any) {
    this.activeCustomer.set(cust);
    this.showViewModal.set(true);
  }

  closeFormModal() {
    this.showFormModal.set(false);
  }

  closeViewModal() {
    this.showViewModal.set(false);
    this.activeCustomer.set(null);
  }

  shiftFromViewToEdit() {
    const cust = this.activeCustomer();
    this.closeViewModal();
    if (cust) {
      this.openEditModal(cust);
    }
  }

  onSubmit() {
    if (this.customerForm.invalid) return;

    const payload = this.customerForm.value;

    if (this.isEditMode()) {
      const id = this.activeCustomerId();
      if (id) {
        this.api.updateCustomer(id, payload).subscribe(() => {
          this.loadCustomers();
          this.closeFormModal();
        });
      }
    } else {
      this.api.createCustomer(payload).subscribe(() => {
        this.loadCustomers();
        this.closeFormModal();
      });
    }
  }

  onDeleteCustomer(id: number) {
    if (confirm('Are you sure you want to delete this customer? All history logs will be removed.')) {
      this.api.deleteCustomer(id).subscribe(() => {
        this.loadCustomers();
      });
    }
  }
}
