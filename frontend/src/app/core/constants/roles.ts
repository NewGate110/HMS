export type UserRole = 'Guest' | 'FrontDeskStaff' | 'HotelManager' | 'Admin';

export const USER_ROLES: readonly UserRole[] = [
  'Guest',
  'FrontDeskStaff',
  'HotelManager',
  'Admin',
] as const;

export function isUserRole(value: string | null | undefined): value is UserRole {
  return !!value && (USER_ROLES as readonly string[]).includes(value);
}

export function roleDashboardPath(role: UserRole): string {
  switch (role) {
    case 'Guest':
      return '/app/guest';
    case 'FrontDeskStaff':
      return '/app/staff';
    case 'HotelManager':
      return '/app/manager';
    case 'Admin':
      return '/app/admin';
    default:
      return '/app';
  }
}
