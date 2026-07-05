import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-fade-in tasks-wrapper">
      <!-- Toolbar Filters -->
      <div class="tasks-toolbar">
        <div class="filters-row">
          <select class="form-input filter-select" (change)="onStatusFilter($event)">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select class="form-input filter-select" (change)="onPriorityFilter($event)">
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        
        <button class="btn btn-primary" (click)="openAddModal()" *ngIf="authService.userRole() !== 'employee'">
          <span>➕</span> Assign Task
        </button>
      </div>

      <!-- Task Lists -->
      <div class="tasks-container">
        <div class="glass-card task-card-item animate-fade-in" *ngFor="let task of filteredTasks()" [class.task-done]="task.status === 'completed'">
          <div class="task-checkbox-col">
            <input 
              type="checkbox" 
              [checked]="task.status === 'completed'" 
              (change)="toggleTaskStatus(task)"
              class="task-checkbox"
            />
          </div>

          <div class="task-details-col">
            <h4 class="task-title-text">{{ task.title }}</h4>
            <div class="task-meta-row">
              <span class="badge" [ngClass]="getPriorityClass(task.priority)">
                {{ task.priority | uppercase }}
              </span>
              <span class="meta-txt">📅 Due: {{ task.dueDate || 'No date' }}</span>
              <span class="meta-txt" *ngIf="getEmployeeName(task.assignedTo)">
                👤 Representative: {{ getEmployeeName(task.assignedTo) }}
              </span>
            </div>
          </div>

          <div class="task-actions-col" *ngIf="authService.userRole() !== 'employee'">
            <button class="action-btn edit-btn" (click)="openEditModal(task)">✏️</button>
            <button class="action-btn delete-btn" (click)="onDeleteTask(task.id)">🗑️</button>
          </div>
        </div>

        <div class="empty-tasks-msg glass-card" *ngIf="filteredTasks().length === 0">
          No tasks found matching current filters.
        </div>
      </div>

      <!-- Add/Edit Task Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showModal()">
        <div class="modal-card glass-card">
          <div class="modal-header-premium">
            <div class="modal-header-icon-title">
              <div class="modal-icon-badge badge-green">✅</div>
              <div class="modal-title-stack">
                <h3 class="modal-title-text">{{ isEditMode() ? 'Modify Task Details' : 'Assign New Task' }}</h3>
                <p class="modal-subtitle-text">Assign action tasks and follow-up activities to staff</p>
              </div>
            </div>
            <button class="close-btn-premium" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="modal-form">
            <div class="form-group">
              <label for="title" class="form-label">Task Objective / Title *</label>
              <input type="text" id="title" formControlName="title" class="form-input" placeholder="e.g. Call Amit Patel to finalize branding offer" />
            </div>

            <div class="form-row">
              <div class="form-group col-6">
                <label for="priority" class="form-label">Priority Level *</label>
                <select id="priority" formControlName="priority" class="form-input">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div class="form-group col-6">
                <label for="dueDate" class="form-label">Due Date *</label>
                <input type="date" id="dueDate" formControlName="dueDate" class="form-input" />
              </div>
            </div>

            <div class="form-group">
              <label for="assignedTo" class="form-label">Assign To representative *</label>
              <select id="assignedTo" formControlName="assignedTo" class="form-input">
                <option [value]="null" disabled selected>Select representative...</option>
                <option *ngFor="let emp of employees()" [value]="emp.id">{{ emp.name }} ({{ emp.role | titlecase }})</option>
              </select>
            </div>

            <div class="form-group">
              <label for="status" class="form-label">Status *</label>
              <select id="status" formControlName="status" class="form-input">
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="taskForm.invalid">
                {{ isEditMode() ? 'Save Task' : 'Assign Task' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .tasks-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .filters-row {
      display: flex;
      gap: 0.75rem;
    }

    .filter-select {
      width: 160px;
      height: 40px;
    }

    .tasks-container {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-card-item {
      display: flex;
      align-items: center;
      padding: 1.25rem 1.5rem;
      gap: 1.25rem;
      border-left: 4px solid var(--primary);
      transition: all 0.2s ease;
    }

    .task-card-item:hover {
      transform: translateX(4px);
    }

    .task-done {
      border-left-color: var(--success);
      opacity: 0.7;
    }

    .task-done .task-title-text {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    .task-checkbox-col {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .task-checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
      accent-color: var(--success);
    }

    .task-details-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .task-title-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .task-meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }

    .meta-txt {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .task-actions-col {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.35rem;
      border-radius: var(--border-radius-sm);
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: var(--border-color);
    }

    .empty-tasks-msg {
      text-align: center;
      padding: 3rem;
      color: var(--text-muted);
      font-size: 0.95rem;
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
      max-width: 540px;
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
export class TasksComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);
  private fb = inject(FormBuilder);

  tasks = signal<any[]>([]);
  employees = signal<any[]>([]);
  
  statusFilter = signal('all');
  priorityFilter = signal('all');
  
  showModal = signal(false);
  isEditMode = signal(false);
  activeTaskId = signal<number | null>(null);

  taskForm: FormGroup;

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      priority: ['medium', Validators.required],
      dueDate: ['', Validators.required],
      assignedTo: [null, Validators.required],
      status: ['pending', Validators.required]
    });
  }

  ngOnInit() {
    this.loadTasks();
    this.loadEmployees();
  }

  loadTasks() {
    this.api.getTasks().subscribe(data => {
      this.tasks.set(data);
    });
  }

  loadEmployees() {
    this.api.getEmployees().subscribe(data => {
      this.employees.set(data);
    }, () => {
      this.employees.set([]);
    });
  }

  filteredTasks(): any[] {
    const s = this.statusFilter();
    const p = this.priorityFilter();

    return this.tasks().filter(t => {
      const matchStatus = s === 'all' || t.status === s;
      const matchPriority = p === 'all' || t.priority === p;
      return matchStatus && matchPriority;
    });
  }

  onStatusFilter(event: Event) {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  onPriorityFilter(event: Event) {
    this.priorityFilter.set((event.target as HTMLSelectElement).value);
  }

  toggleTaskStatus(task: any) {
    const originalStatus = task.status;
    const newStatus = originalStatus === 'completed' ? 'pending' : 'completed';
    task.status = newStatus;

    this.api.updateTask(task.id, { status: newStatus }).subscribe({
      next: () => {
        this.loadTasks();
      },
      error: () => {
        task.status = originalStatus; // Rollback
      }
    });
  }

  getEmployeeName(id: any): string {
    const emp = this.employees().find(e => e.id === Number(id));
    return emp ? emp.name : '';
  }

  getPriorityClass(p: string): string {
    switch (p) {
      case 'high': return 'badge-error';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-info';
      default: return 'badge-info';
    }
  }

  openAddModal() {
    this.isEditMode.set(false);
    this.activeTaskId.set(null);
    this.taskForm.reset({ priority: 'medium', status: 'pending', assignedTo: null });
    this.showModal.set(true);
  }

  openEditModal(task: any) {
    this.isEditMode.set(true);
    this.activeTaskId.set(task.id);
    this.taskForm.patchValue({
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo,
      status: task.status
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.taskForm.invalid) return;
    const payload = this.taskForm.value;
    payload.assignedTo = Number(payload.assignedTo);

    if (this.isEditMode()) {
      const id = this.activeTaskId();
      if (id) {
        this.api.updateTask(id, payload).subscribe(() => {
          this.loadTasks();
          this.closeModal();
        });
      }
    } else {
      this.api.createTask(payload).subscribe(() => {
        this.loadTasks();
        this.closeModal();
      });
    }
  }

  onDeleteTask(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.api.deleteTask(id).subscribe(() => {
        this.loadTasks();
      });
    }
  }
}
