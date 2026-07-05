import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in reports-wrapper">
      <!-- Summary metrics cards -->
      <div class="reports-summary-grid">
        <div class="glass-card metric-item">
          <span class="metric-label">TOTAL SALES PIPELINE</span>
          <h2 class="metric-val">$184,500</h2>
        </div>
        <div class="glass-card metric-item">
          <span class="metric-label">REVENUE CONVERTED</span>
          <h2 class="metric-val" style="color: var(--success);">$92,850</h2>
        </div>
        <div class="glass-card metric-item">
          <span class="metric-label">LOST OPPORTUNITY COST</span>
          <h2 class="metric-val" style="color: var(--error);">$25,000</h2>
        </div>
      </div>

      <!-- Action Panel -->
      <div class="glass-card actions-panel">
        <h4 class="section-title">Data Export Center</h4>
        <p class="text-muted">Generate consolidated business spreadsheets and print ledger summaries.</p>
        
        <div class="export-actions">
          <button class="btn btn-secondary" (click)="simulateExport('PDF')" [disabled]="isExportingPDF()">
            📄 {{ isExportingPDF() ? 'Generating PDF...' : 'Export PDF Report' }}
          </button>
          <button class="btn btn-secondary" (click)="simulateExport('Excel')" [disabled]="isExportingExcel()">
            📊 {{ isExportingExcel() ? 'Generating Sheet...' : 'Export Excel Datasheet' }}
          </button>
        </div>
      </div>

      <!-- Sales breakdown list -->
      <div class="glass-card ledger-card">
        <h4 class="section-title">Sales Representative Conversions Ledger</h4>
        <div class="table-responsive" style="margin-top: 1rem;">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Representative Name</th>
                <th>Assigned Leads Count</th>
                <th>Successful Deals (Won)</th>
                <th>Target Conversion Rate</th>
                <th>Total Converted Value</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rep of salesRepData()">
                <td><strong>{{ rep.name }}</strong></td>
                <td>{{ rep.leads }}</td>
                <td>{{ rep.deals }}</td>
                <td>{{ rep.conversionRate }}%</td>
                <td><strong style="color: var(--success);">&#36;{{ rep.value.toLocaleString() }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .reports-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
    }

    .metric-item {
      padding: 1.5rem;
    }

    .metric-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .metric-val {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-main);
      margin-top: 0.25rem;
    }

    .actions-panel {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .export-actions {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .ledger-card {
      padding: 1.75rem;
    }
  `]
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);

  isExportingPDF = signal(false);
  isExportingExcel = signal(false);

  salesRepData = signal([
    { name: 'Rahul Employee', leads: 4, deals: 3, conversionRate: 75, value: 52000 },
    { name: 'Jane Manager', leads: 2, deals: 1, conversionRate: 50, value: 40850 },
    { name: 'Super Admin', leads: 1, deals: 0, conversionRate: 0, value: 0 }
  ]);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.api.getLeads().subscribe(leads => {
      this.api.getEmployees().subscribe(employees => {
        const matrix = employees.map(emp => {
          const empLeads = leads.filter(l => l.assignedTo === emp.id);
          const wonLeads = empLeads.filter(l => l.status === 'won');
          const conversionRate = empLeads.length > 0 ? Math.round((wonLeads.length / empLeads.length) * 100) : 0;
          const value = wonLeads.length * 15000;

          return {
            name: emp.name,
            leads: empLeads.length,
            deals: wonLeads.length,
            conversionRate,
            value
          };
        });
        
        this.salesRepData.set(matrix);
      });
    });
  }

  simulateExport(type: 'PDF' | 'Excel') {
    if (type === 'PDF') {
      this.isExportingPDF.set(true);
      setTimeout(() => {
        this.isExportingPDF.set(false);
        alert('SUCCESS: CRM Summary Report PDF has been generated and saved to downloads folder.');
      }, 1500);
    } else {
      this.isExportingExcel.set(true);
      setTimeout(() => {
        this.isExportingExcel.set(false);
        alert('SUCCESS: CRM Conversions ledger Excel Sheet has been exported.');
      }, 1500);
    }
  }
}
