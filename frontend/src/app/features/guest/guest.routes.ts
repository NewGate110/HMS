import type { Routes } from '@angular/router';

export const GUEST_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./guest-dashboard/guest-dashboard.component').then((m) => m.GuestDashboardComponent),
  },
  {
    path: 'booking',
    loadComponent: () =>
      import('./booking-wizard/booking-wizard.component').then((m) => m.BookingWizardComponent),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./guest-profile/guest-profile.component').then((m) => m.GuestProfileComponent),
  },
];
