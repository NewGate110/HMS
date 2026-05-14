import type { Routes } from '@angular/router';

export const STAFF_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./staff-dashboard/staff-dashboard.component').then((m) => m.StaffDashboardComponent),
  },
  {
    path: 'checkin',
    loadComponent: () =>
      import('./check-in-flow/check-in-flow.component').then((m) => m.CheckInFlowComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./check-out-flow/check-out-flow.component').then((m) => m.CheckOutFlowComponent),
  },
  {
    path: 'rooms',
    loadComponent: () =>
      import('./room-status-board/room-status-board.component').then((m) => m.RoomStatusBoardComponent),
  },
  {
    path: 'walk-in',
    loadComponent: () =>
      import('./walk-in-booking/walk-in-booking.component').then((m) => m.WalkInBookingComponent),
  },
];
