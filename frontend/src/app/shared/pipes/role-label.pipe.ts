import { Pipe, PipeTransform } from '@angular/core';
import type { UserRole } from '../../core/constants/roles';

@Pipe({ name: 'roleLabel', standalone: true })
export class RoleLabelPipe implements PipeTransform {
  transform(role: string | null | undefined): string {
    switch (role as UserRole) {
      case 'Guest':
        return 'Guest';
      case 'FrontDeskStaff':
        return 'Front desk';
      case 'HotelManager':
        return 'Manager';
      case 'Admin':
        return 'Administrator';
      default:
        return role ?? '—';
    }
  }
}
