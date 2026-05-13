import type { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./manager-dashboard/manager-dashboard.component').then(
        (m) => m.ManagerDashboardComponent,
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports-page.component').then((m) => m.ReportsPageComponent),
  },
  {
    path: 'staff',
    loadComponent: () =>
      import('./staff-performance/staff-performance.component').then(
        (m) => m.StaffPerformanceComponent,
      ),
  },
];
