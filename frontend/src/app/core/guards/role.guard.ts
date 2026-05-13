import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import type { UserRole } from '../constants/roles';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as UserRole[] | undefined;
  if (!allowed?.length) return true;
  const role = auth.role();
  if (role && allowed.includes(role)) return true;
  return router.createUrlTree(['/unauthorized']);
};
