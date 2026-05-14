import type { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/landing/landing.component').then((m) => m.LandingComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'rooms/search',
        loadComponent: () =>
          import('./features/rooms/room-search/room-search.component').then(
            (m) => m.RoomSearchComponent,
          ),
      },
      {
        path: 'rooms/:id',
        loadComponent: () =>
          import('./features/rooms/room-detail/room-detail.component').then(
            (m) => m.RoomDetailComponent,
          ),
      },
      {
        path: 'hotel',
        loadComponent: () =>
          import('./pages/hotel-info/hotel-info.component').then((m) => m.HotelInfoComponent),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./pages/contact/contact.component').then((m) => m.ContactComponent),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shell/dashboard-layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./shell/role-home/role-home.component').then((m) => m.RoleHomeComponent),
      },
      {
        path: 'guest',
        canActivate: [roleGuard],
        data: { roles: ['Guest'] },
        loadChildren: () => import('./features/guest/guest.routes').then((m) => m.GUEST_ROUTES),
      },
      {
        path: 'staff',
        canActivate: [roleGuard],
        data: { roles: ['FrontDeskStaff', 'HotelManager', 'Admin'] },
        loadChildren: () => import('./features/staff/staff.routes').then((m) => m.STAFF_ROUTES),
      },
      {
        path: 'manager',
        canActivate: [roleGuard],
        data: { roles: ['HotelManager', 'Admin'] },
        loadChildren: () =>
          import('./features/manager/manager.routes').then((m) => m.MANAGER_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'bookings',
        loadChildren: () =>
          import('./features/bookings/bookings.routes').then((m) => m.BOOKINGS_ROUTES),
      },
      {
        path: 'billing',
        loadChildren: () =>
          import('./features/billing/billing.routes').then((m) => m.BILLING_ROUTES),
      },
    ],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
