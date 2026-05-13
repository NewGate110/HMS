import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { roleDashboardPath } from '../../core/constants/roles';

@Component({
  selector: 'app-role-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class RoleHomeComponent {
  constructor() {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();
    if (role) void router.navigateByUrl(roleDashboardPath(role), { replaceUrl: true });
    else void router.navigateByUrl('/login');
  }
}
