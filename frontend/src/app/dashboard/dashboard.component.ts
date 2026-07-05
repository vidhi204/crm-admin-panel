import { Component, OnInit, ElementRef, ViewChild, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/api.service';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-fade-in dashboard-wrapper">
      <div class="dashboard-header">
        <h1 class="title-primary">Real-time CRM Analytics</h1>
        <p class="subtitle">Operational insights, active leads status and monthly reports</p>
      </div>

      <!-- Statistics Grid -->
      <div class="stats-grid">
        <!-- Customers Card -->
        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper blue-icon">👥</div>
          <div class="stat-content">
            <span class="stat-label">TOTAL CUSTOMERS</span>
            <h2 class="stat-number">{{ customersCount() }}</h2>
            <span class="badge badge-success">+15% vs last month</span>
          </div>
        </div>

        <!-- Leads Card -->
        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper orange-icon">🎯</div>
          <div class="stat-content">
            <span class="stat-label">ACTIVE LEADS</span>
            <h2 class="stat-number">{{ leadsCount() }}</h2>
            <span class="badge badge-warning">{{ pendingFollowUps() }} follow-ups</span>
          </div>
        </div>

        <!-- Tasks Card -->
        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper green-icon">✅</div>
          <div class="stat-content">
            <span class="stat-label">PENDING TASKS</span>
            <h2 class="stat-number">{{ pendingTasksCount() }}</h2>
            <span class="badge badge-info">{{ completedTasksRate() }}% completion rate</span>
          </div>
        </div>

        <!-- Conversion Card -->
        <div class="glass-card stat-card">
          <div class="stat-icon-wrapper purple-icon">📈</div>
          <div class="stat-content">
            <span class="stat-label">LEAD WIN RATE</span>
            <h2 class="stat-number">{{ winRate() }}%</h2>
            <span class="badge badge-success">Target: 40%</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <div class="glass-card chart-card">
          <h3 class="chart-title">Revenue & Sales Trends</h3>
          <div class="chart-container">
            <canvas #revenueChart></canvas>
          </div>
        </div>

        <div class="glass-card chart-card">
          <h3 class="chart-title">Leads Funnel Status</h3>
          <div class="chart-container">
            <canvas #funnelChart></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Operations Table -->
      <div class="glass-card recent-activity-card">
        <h3 class="card-section-title">Recent Leads Log</h3>
        <div class="table-responsive">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Lead Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let lead of recentLeads()">
                <td><strong>{{ lead.name }}</strong></td>
                <td>{{ lead.company }}</td>
                <td>{{ lead.email }}</td>
                <td>{{ lead.phone }}</td>
                <td>
                  <span class="badge" [ngClass]="getStatusClass(lead.status)">
                    {{ lead.status | uppercase }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="recentLeads().length === 0">
                <td colspan="5" class="empty-table-msg">No recent leads found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem;
      transition: transform 0.25s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
    }

    .stat-icon-wrapper {
      width: 54px;
      height: 54px;
      border-radius: var(--border-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: var(--shadow-sm);
    }

    .blue-icon { background: rgba(59, 130, 246, 0.15); }
    .orange-icon { background: rgba(245, 158, 11, 0.15); }
    .green-icon { background: rgba(16, 185, 129, 0.15); }
    .purple-icon { background: rgba(139, 92, 246, 0.15); }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .stat-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .stat-number {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-main);
      line-height: 1.1;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1.25fr;
      gap: 1.5rem;
    }

    @media (max-width: 992px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chart-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 280px;
    }

    .recent-activity-card {
      padding: 1.75rem;
    }

    .card-section-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 1.25rem;
    }

    /* Table Styles */
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    .crm-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .crm-table th {
      padding: 1rem;
      border-bottom: 2px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .crm-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.9rem;
      color: var(--text-main);
    }

    .crm-table tr:last-child td {
      border-bottom: none;
    }

    .empty-table-msg {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem 0;
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);

  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('funnelChart') funnelChartCanvas!: ElementRef<HTMLCanvasElement>;

  customersCount = signal(0);
  leadsCount = signal(0);
  pendingTasksCount = signal(0);
  completedTasksRate = signal(0);
  pendingFollowUps = signal(0);
  winRate = signal(0);
  
  recentLeads = signal<any[]>([]);

  private revChartInstance: Chart | null = null;
  private funChartInstance: Chart | null = null;

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    // We delay slightly to let layout dimensions initialize
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  loadStats() {
    // Customers Count
    this.api.getCustomers().subscribe(data => {
      this.customersCount.set(data.length);
    });

    // Leads Stats
    this.api.getLeads().subscribe(data => {
      this.leadsCount.set(data.length);
      this.recentLeads.set(data.slice(-4).reverse());
      
      const wonLeads = data.filter((l: any) => l.status === 'won').length;
      const rate = data.length > 0 ? Math.round((wonLeads / data.length) * 100) : 0;
      this.winRate.set(rate);

      const followUps = data.filter((l: any) => {
        if (!l.followUpDate) return false;
        return new Date(l.followUpDate) >= new Date();
      }).length;
      this.pendingFollowUps.set(followUps);

      // Refresh funnel chart values dynamically if ready
      this.updateFunnelChart(data);
    });

    // Tasks Stats
    this.api.getTasks().subscribe(data => {
      const pending = data.filter((t: any) => t.status === 'pending').length;
      const completed = data.filter((t: any) => t.status === 'completed').length;
      this.pendingTasksCount.set(pending);
      
      const total = data.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      this.completedTasksRate.set(rate);
    });
  }

  initCharts() {
    // Chart 1: Revenue Line/Area Chart (Mock values for trends)
    if (this.revenueChartCanvas) {
      this.revChartInstance = new Chart(this.revenueChartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
          datasets: [{
            label: 'Monthly Sales ($)',
            data: [12000, 19000, 15000, 28000, 22000, 35000, 42850],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { grid: { color: 'rgba(100, 116, 139, 0.1)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // Chart 2: Funnel Doughnut Chart
    if (this.funnelChartCanvas) {
      this.funChartInstance = new Chart(this.funnelChartCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['New', 'Contacted', 'Qualified', 'Won', 'Lost'],
          datasets: [{
            data: [0, 0, 0, 0, 0], // Initial values, filled by updateFunnelChart
            backgroundColor: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15 } }
          }
        }
      });
    }
  }

  updateFunnelChart(leads: any[]) {
    if (!this.funChartInstance) return;
    
    const newCount = leads.filter(l => l.status === 'new').length;
    const contactedCount = leads.filter(l => l.status === 'contacted').length;
    const qualifiedCount = leads.filter(l => l.status === 'qualified').length;
    const wonCount = leads.filter(l => l.status === 'won').length;
    const lostCount = leads.filter(l => l.status === 'lost').length;

    this.funChartInstance.data.datasets[0].data = [
      newCount, contactedCount, qualifiedCount, wonCount, lostCount
    ];
    this.funChartInstance.update();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'new': return 'badge-info';
      case 'contacted': return 'badge-warning';
      case 'qualified': return 'badge-secondary';
      case 'won': return 'badge-success';
      case 'lost': return 'badge-error';
      default: return 'badge-info';
    }
  }
}
