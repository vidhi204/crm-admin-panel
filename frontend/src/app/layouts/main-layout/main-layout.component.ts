import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { ThemeService } from '../../core/theme.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: string[]; // Allowed roles (if empty, all roles allowed)
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="isSidebarCollapsed()">
        <div class="sidebar-brand">
          <div class="logo-circle-sm">CRM</div>
          <span class="logo-text" *ngIf="!isSidebarCollapsed()">Enterprise CRM</span>
        </div>

        <nav class="sidebar-nav">
          <ul>
            <li *ngFor="let item of navItems">
              <a 
                *ngIf="hasAccess(item)" 
                [routerLink]="item.path" 
                routerLinkActive="active-link"
                class="nav-item-link"
                [title]="item.label"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label" *ngIf="!isSidebarCollapsed()">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- User profile panel in sidebar footer -->
        <div class="sidebar-footer" *ngIf="currentUser()">
          <div class="user-avatar">
            {{ currentUser()?.name?.charAt(0) || 'U' }}
          </div>
          <div class="user-info" *ngIf="!isSidebarCollapsed()">
            <div class="user-name">{{ currentUser()?.name }}</div>
            <div class="user-role">{{ currentUser()?.role | titlecase }}</div>
          </div>
        </div>
      </aside>

      <!-- Main Panel -->
      <div class="main-container" [class.expanded]="isSidebarCollapsed()">
        <!-- Header -->
        <header class="header">
          <div class="header-left">
            <button class="toggle-sidebar-btn" (click)="toggleSidebar()">
              {{ isSidebarCollapsed() ? '➡️' : '⬅️' }}
            </button>
            <h2 class="active-page-title">{{ getActivePageTitle() }}</h2>
          </div>

          <div class="header-right">
            <!-- Theme Toggle -->
            <button class="header-icon-btn" (click)="themeService.toggleTheme()" title="Toggle Theme">
              {{ themeService.theme() === 'light' ? '🌙' : '☀️' }}
            </button>

            <!-- Notifications -->
            <div class="notification-wrapper">
              <button class="header-icon-btn" (click)="toggleNotifications()" title="Notifications">
                🔔 <span class="badge-dot" *ngIf="hasUnreadNotifications()"></span>
              </button>
              
              <!-- Dropdown Simulator -->
              <div class="notification-dropdown glass-card animate-fade-in" *ngIf="showNotifications()">
                <div class="dropdown-header">
                  <h3>Notifications</h3>
                  <button class="text-btn" (click)="clearNotifications()">Clear all</button>
                </div>
                <div class="dropdown-list">
                  <div class="dropdown-item" *ngFor="let n of notifications()">
                    <p class="n-message">{{ n.message }}</p>
                    <span class="n-time">{{ n.time }}</span>
                  </div>
                  <div class="empty-notifications" *ngIf="notifications().length === 0">
                    No new notifications
                  </div>
                </div>
              </div>
            </div>

            <!-- Logout -->
            <button class="btn btn-secondary logout-btn" (click)="onLogout()">
              <span>🚪</span> <span class="logout-text">Logout</span>
            </button>
          </div>
        </header>

        <!-- Dynamic Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-brand {
      height: 70px;
      display: flex;
      align-items: center;
      padding: 0 1.25rem;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .logo-circle-sm {
      width: 36px;
      height: 36px;
      border-radius: var(--border-radius-full);
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      font-weight: 800;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .logo-text {
      font-weight: 700;
      font-size: 1.1rem;
      letter-spacing: -0.025em;
      color: var(--text-main);
    }

    .sidebar-nav {
      flex: 1;
      padding: 1.5rem 0.75rem;
      overflow-y: auto;
    }

    .sidebar-nav ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .nav-item-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--text-muted);
      border-radius: var(--border-radius-sm);
      text-decoration: none;
      font-weight: 500;
      transition: all var(--transition-speed) ease;
    }

    .nav-item-link:hover {
      background: var(--primary-light);
      color: var(--primary);
    }

    .active-link {
      background: var(--primary);
      color: #ffffff !important;
      box-shadow: 0 4px 12px hsla(var(--primary-base), 0.2);
    }

    .nav-icon {
      font-size: 1.2rem;
      width: 24px;
      display: inline-flex;
      justify-content: center;
    }

    .sidebar-footer {
      padding: 1.25rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 38px;
      height: 38px;
      border-radius: var(--border-radius-full);
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border-color);
      flex-shrink: 0;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.85rem;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* Collapsed Sidebar Styles */
    .sidebar.collapsed {
      width: 70px;
    }

    .main-container.expanded {
      margin-left: 70px;
    }

    .sidebar.collapsed .sidebar-footer {
      justify-content: center;
      padding: 1.25rem 0.5rem;
    }

    /* Header Actions */
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .toggle-sidebar-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      color: var(--text-muted);
      transition: color 0.2s;
    }

    .toggle-sidebar-btn:hover {
      color: var(--primary);
    }

    .active-page-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .header-icon-btn {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1.1rem;
      position: relative;
      transition: background 0.2s;
    }

    .header-icon-btn:hover {
      background: var(--border-color);
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--error);
      position: absolute;
      top: 8px;
      right: 8px;
      border: 2px solid var(--bg-panel-solid);
    }

    .logout-btn {
      height: 40px;
      padding: 0 1rem;
    }

    .notification-wrapper {
      position: relative;
    }

    .notification-dropdown {
      position: absolute;
      right: 0;
      top: 50px;
      width: 320px;
      padding: 1rem;
      z-index: 1000;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .dropdown-header h3 {
      font-size: 0.9rem;
      font-weight: 600;
    }

    .text-btn {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }

    .dropdown-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 240px;
      overflow-y: auto;
    }

    .dropdown-item {
      padding: 0.5rem;
      border-radius: var(--border-radius-sm);
      background: rgba(0, 0, 0, 0.02);
      border-left: 3px solid var(--primary);
    }

    [data-theme="dark"] .dropdown-item {
      background: rgba(255, 255, 255, 0.02);
    }

    .n-message {
      font-size: 0.8rem;
      color: var(--text-main);
    }

    .n-time {
      font-size: 0.7rem;
      color: var(--text-muted);
    }

    .empty-notifications {
      text-align: center;
      padding: 1rem 0;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    @media (max-width: 640px) {
      .logout-text {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  router = inject(Router);

  isSidebarCollapsed = signal(false);
  showNotifications = signal(false);

  currentUser = this.authService.currentUser;

  // Simulator notifications
  notifications = signal([
    { message: 'New Lead generated: Rahul Sharma', time: '5 mins ago' },
    { message: 'Follow-up Reminder for Amit Patel', time: '1 hour ago' },
    { message: 'Task assigned by Admin: Update settings', time: '2 hours ago' }
  ]);

  hasUnreadNotifications = () => this.notifications().length > 0;

  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Leads', path: '/leads', icon: '🎯' },
    { label: 'Customers', path: '/customers', icon: '👥' },
    { label: 'Tasks', path: '/tasks', icon: '✅' },
    { label: 'Employees', path: '/employees', icon: '💼', roles: ['admin', 'manager'] },
    { label: 'Reports', path: '/reports', icon: '📈', roles: ['admin', 'manager'] },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
    { label: 'Users', path: '/users', icon: '👤', roles: ['admin'] },
    { label: 'Roles', path: '/roles', icon: '🛡️', roles: ['admin'] }
  ];

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }

  clearNotifications() {
    this.notifications.set([]);
  }

  hasAccess(item: NavItem): boolean {
    if (!item.roles) return true;
    const currentRole = this.authService.userRole();
    return item.roles.includes(currentRole);
  }

  getActivePageTitle(): string {
    const url = this.router.url.split('?')[0];
    const matchingItem = this.navItems.find(item => url.startsWith(item.path));
    return matchingItem ? matchingItem.label : 'CRM Panel';
  }

  onLogout() {
    this.authService.logout();
  }
}
