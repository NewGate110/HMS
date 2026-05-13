import type { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./user-management/user-management.component').then((m) => m.UserManagementComponent),
  },
  {
    path: 'config',
    loadComponent: () =>
      import('./hotel-config/hotel-config.component').then((m) => m.HotelConfigComponent),
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
  },
];
