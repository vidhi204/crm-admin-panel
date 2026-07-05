import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in leads-wrapper">
      <!-- Toolbar -->
      <div class="leads-toolbar">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Search leads by name, email or company..." 
            class="form-input search-input"
            (input)="onSearch($event)"
          />
        </div>
        <button class="btn btn-primary" (click)="openAddModal()">
          <span>➕</span> Add Lead
        </button>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board">
        <!-- Columns -->
        <div class="kanban-column" *ngFor="let col of columns">
          <div class="column-header" [ngClass]="col.headerClass">
            <span class="column-title">{{ col.label }}</span>
            <span class="column-count">{{ getLeadsByStatus(col.id).length }}</span>
          </div>

          <div class="column-cards">
            <div 
              class="glass-card lead-card hover-grow animate-fade-in" 
              *ngFor="let lead of getLeadsByStatus(col.id)"
              (click)="openEditModal(lead)"
            >
              <h4 class="lead-name">{{ lead.name }}</h4>
              <p class="lead-company">{{ lead.company || 'Individual' }}</p>
              
              <div class="lead-meta">
                <span class="meta-item">📧 {{ lead.email }}</span>
                <span class="meta-item" *ngIf="lead.followUpDate">📅 {{ lead.followUpDate }}</span>
              </div>
              
              <!-- Quick status switcher on card footer (so they can shift columns instantly) -->
              <div class="card-actions" (click)="$event.stopPropagation()">
                <select 
                  class="status-select-sm" 
                  [value]="lead.status" 
                  (change)="onStatusChange(lead, $any($event.target).value)"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>

            <!-- Empty State for Column -->
            <div class="empty-column-state" *ngIf="getLeadsByStatus(col.id).length === 0">
              No leads here
            </div>
          </div>
        </div>
      </div>

      <!-- Lead Creation / Edit Modal Dialog -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showModal()">
        <div class="modal-card glass-card">
          <div class="modal-header-premium">
            <div class="modal-header-icon-title">
              <div class="modal-icon-badge badge-blue">🎯</div>
              <div class="modal-title-stack">
                <h3 class="modal-title-text">{{ isEditMode() ? 'Edit Lead Details' : 'Add New Lead' }}</h3>
                <p class="modal-subtitle-text">Create or update lead records — maintain high data quality</p>
              </div>
            </div>
            <button class="close-btn-premium" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="leadForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-row">
              <div class="form-group col-6">
                <label for="name" class="form-label">Full Name *</label>
                <input type="text" id="name" formControlName="name" class="form-input" placeholder="Rahul Sharma" />
              </div>
              <div class="form-group col-6">
                <label for="company" class="form-label">Company Name</label>
                <input type="text" id="company" formControlName="company" class="form-input" placeholder="Sharma Technologies" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label for="email" class="form-label">Email Address *</label>
                <input type="email" id="email" formControlName="email" class="form-input" placeholder="rahul&#64;sharma.com" />
              </div>
              <div class="form-group col-6">
                <label for="phone" class="form-label">Phone Number</label>
                <input type="text" id="phone" formControlName="phone" class="form-input" placeholder="9876543210" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label for="status" class="form-label">Lead Status *</label>
                <select id="status" formControlName="status" class="form-input">
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div class="form-group col-6">
                <label for="followUpDate" class="form-label">Follow-up Date</label>
                <input type="date" id="followUpDate" formControlName="followUpDate" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label for="assignedTo" class="form-label">Assign Representative</label>
              <select id="assignedTo" formControlName="assignedTo" class="form-input">
                <option [value]="null">Unassigned</option>
                <option *ngFor="let emp of employees()" [value]="emp.id">{{ emp.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="notes" class="form-label">Lead Notes</label>
              <textarea id="notes" formControlName="notes" class="form-input" rows="3" placeholder="Interested in E-commerce platforms..."></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button 
                type="button" 
                class="btn btn-error" 
                *ngIf="isEditMode() && authService.userRole() === 'admin'"
                (click)="onDeleteLead()"
              >
                Delete
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="leadForm.invalid">
                {{ isEditMode() ? 'Save Changes' : 'Create Lead' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .leads-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .leads-toolbar {
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

    .kanban-board {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
      align-items: start;
    }

    @media (max-width: 1200px) {
      .kanban-board {
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
    }

    .kanban-column {
      background: rgba(255, 255, 255, 0.05);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      max-height: 80vh;
    }
    
    [data-theme="light"] .kanban-column {
      background: rgba(0, 0, 0, 0.02);
    }

    .column-header {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--border-color);
      border-top-left-radius: var(--border-radius-md);
      border-top-right-radius: var(--border-radius-md);
    }

    .col-new { border-bottom-color: var(--info); }
    .col-contacted { border-bottom-color: var(--warning); }
    .col-qualified { border-bottom-color: var(--secondary); }
    .col-won { border-bottom-color: var(--success); }
    .col-lost { border-bottom-color: var(--error); }

    .column-title {
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-main);
    }

    .column-count {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: var(--border-radius-full);
      background: var(--border-color);
      color: var(--text-muted);
    }

    .column-cards {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow-y: auto;
      flex: 1;
    }

    .lead-card {
      padding: 1rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .lead-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .lead-company {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .lead-meta {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      border-top: 1px dashed var(--border-color);
      padding-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 0.25rem;
    }

    .status-select-sm {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.2rem 0.4rem;
      outline: none;
    }

    .empty-column-state {
      text-align: center;
      padding: 2rem 0;
      font-size: 0.8rem;
      color: var(--text-muted);
      border: 1px dashed var(--border-color);
      border-radius: var(--border-radius-sm);
    }

    /* Modal Styles */
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
      max-width: 600px;
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

    .btn-error {
      background: var(--error-light);
      color: var(--error);
      margin-right: auto; /* Push delete button to the left */
    }

    .btn-error:hover {
      background: var(--error);
      color: #ffffff;
    }
  `]
})
export class LeadsComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  leads = signal<any[]>([]);
  employees = signal<any[]>([]);
  searchQuery = signal('');

  showModal = signal(false);
  isEditMode = signal(false);
  activeLeadId = signal<number | null>(null);

  leadForm: FormGroup;

  columns = [
    { id: 'new', label: 'New Inquiries', headerClass: 'col-new' },
    { id: 'contacted', label: 'Contacted', headerClass: 'col-contacted' },
    { id: 'qualified', label: 'Qualified', headerClass: 'col-qualified' },
    { id: 'won', label: 'Won (Clients)', headerClass: 'col-won' },
    { id: 'lost', label: 'Lost', headerClass: 'col-lost' }
  ];

  constructor() {
    this.leadForm = this.fb.group({
      name: ['', Validators.required],
      company: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      status: ['new', Validators.required],
      followUpDate: [''],
      assignedTo: [null],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadLeads();
    this.loadEmployees();
  }

  loadLeads() {
    this.api.getLeads().subscribe(data => {
      this.leads.set(data);
    });
  }

  loadEmployees() {
    this.api.getEmployees().subscribe(data => {
      this.employees.set(data);
    }, () => {
      this.employees.set([]);
    });
  }

  getLeadsByStatus(status: string): any[] {
    const q = this.searchQuery().toLowerCase();
    return this.leads().filter(lead => {
      if (lead.status !== status) return false;
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        (lead.company && lead.company.toLowerCase().includes(q)) ||
        lead.email.toLowerCase().includes(q)
      );
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusChange(lead: any, newStatus: string) {
    const originalStatus = lead.status;
    lead.status = newStatus;

    this.api.updateLead(lead.id, { status: newStatus }).subscribe({
      next: (updated) => {
        if (newStatus === 'won' && originalStatus !== 'won') {
          this.api.createCustomer({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: lead.company,
            address: '',
            history: `Onboarded from won lead log on ${new Date().toISOString().split('T')[0]}.`
          }).subscribe();
        }
        this.loadLeads();
      },
      error: () => {
        lead.status = originalStatus; // Rollback
      }
    });
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.activeLeadId.set(null);
    this.leadForm.reset({ status: 'new', assignedTo: null });
    this.showModal.set(true);
  }

  openEditModal(lead: any) {
    this.isEditMode.set(true);
    this.activeLeadId.set(lead.id);
    this.leadForm.patchValue({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      status: lead.status,
      followUpDate: lead.followUpDate,
      assignedTo: lead.assignedTo,
      notes: lead.notes
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.leadForm.invalid) return;

    const payload = this.leadForm.value;
    payload.assignedTo = payload.assignedTo ? Number(payload.assignedTo) : null;

    if (this.isEditMode()) {
      const id = this.activeLeadId();
      if (id) {
        this.api.updateLead(id, payload).subscribe(() => {
          this.loadLeads();
          this.closeModal();
        });
      }
    } else {
      this.api.createLead(payload).subscribe(() => {
        this.loadLeads();
        this.closeModal();
      });
    }
  }

  onDeleteLead() {
    const id = this.activeLeadId();
    if (id && confirm('Are you sure you want to delete this lead?')) {
      this.api.deleteLead(id).subscribe(() => {
        this.loadLeads();
        this.closeModal();
      });
    }
  }
}
