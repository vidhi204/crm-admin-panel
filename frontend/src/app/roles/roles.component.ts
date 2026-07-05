import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { AuthService } from '../auth/auth.service';

interface RolePermissionRow {
  module: string;
  admin: boolean;
  manager: boolean;
  employee: string; // Detail description
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in roles-wrapper">
      <div class="glass-card instruction-card">
        <h3 class="instruction-title">Role-Based Access Control (RBAC) Matrix</h3>
        <p class="text-muted" style="margin-top: 0.5rem;">
          Permissions are enforced dynamically both on the Node.js Express API level (via JWT claims verify) and on the Angular Frontend level (via Route Guards and layouts filters).
        </p>
      </div>

      <!-- Permission Grid Matrix -->
      <div class="glass-card table-card" style="margin-top: 1.5rem;">
        <div class="table-responsive">
          <table class="crm-table">
            <thead>
              <tr>
                <th>System Module / Resource</th>
                <th>🛡️ Super Admin Permission</th>
                <th>💼 Manager Permission</th>
                <th>👤 Employee Permission</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of permissionsMatrix()">
                <td><strong>{{ row.module }}</strong></td>
                <td>
                  <span class="badge" [ngClass]="row.admin ? 'badge-success' : 'badge-error'">
                    {{ row.admin ? 'FULL ACCESS' : 'DENIED' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="row.manager ? 'badge-success' : 'badge-error'">
                    {{ row.manager ? 'FULL ACCESS' : 'DENIED' }}
                  </span>
                </td>
                <td>
                  <span 
                    class="badge" 
                    [ngClass]="row.employee === 'DENIED' ? 'badge-error' : (row.employee === 'OWN DATA ONLY' ? 'badge-warning' : 'badge-success')"
                  >
                    {{ row.employee }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .roles-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .instruction-card {
      padding: 1.5rem;
      border-left: 4px solid var(--primary);
    }

    .instruction-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .table-card {
      padding: 0.5rem;
    }
  `]
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  authService = inject(AuthService);

  permissionsMatrix = signal<RolePermissionRow[]>([
    { module: 'Dashboard Statistics', admin: true, manager: true, employee: 'OWN DATA ONLY' },
    { module: 'Leads Management', admin: true, manager: true, employee: 'OWN DATA ONLY' },
    { module: 'Customers Roster', admin: true, manager: true, employee: 'DENIED' },
    { module: 'Task Assignments', admin: true, manager: true, employee: 'OWN DATA ONLY' },
    { module: 'Employee Performance Logs', admin: true, manager: true, employee: 'DENIED' },
    { module: 'Export PDF / CSV Reports', admin: true, manager: true, employee: 'DENIED' },
    { module: 'System Security Settings', admin: true, manager: false, employee: 'DENIED' },
    { module: 'User Accounts Credentials', admin: true, manager: false, employee: 'DENIED' }
  ]);

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.api.getRoles().subscribe();
  }
}
