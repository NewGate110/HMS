import type { UserRole } from './roles';
import type { SidebarNavItem } from '../../shared/ui/app-sidebar/app-sidebar.component';

export function sidebarItemsForRole(role: UserRole): SidebarNavItem[] {
  switch (role) {
    case 'Guest':
      return [
        { label: 'Dashboard', icon: 'space_dashboard', link: ['/app/guest/dashboard'] },
        // { label: 'Book', icon: 'hotel', link: ['/app/guest/booking'] },
        { label: 'Bookings', icon: 'book_online', link: ['/app/bookings'] },
        { label: 'Billing', icon: 'receipt_long', link: ['/app/billing'] },
        { label: 'Profile', icon: 'person', link: ['/app/guest/profile'] },
      ];
    case 'FrontDeskStaff':
      return [
        { label: 'Dashboard', icon: 'space_dashboard', link: ['/app/staff/dashboard'] },
        { label: 'Check-in', icon: 'login', link: ['/app/staff/checkin'] },
        { label: 'Check-out', icon: 'logout', link: ['/app/staff/checkout'] },
        { label: 'Walk-In', icon: 'hail', link: ['/app/staff/walk-in'] },
        { label: 'Rooms', icon: 'meeting_room', link: ['/app/staff/rooms'] },
        { label: 'Bookings', icon: 'book_online', link: ['/app/bookings'] },
      ];
    case 'HotelManager':
      return [
        { label: 'Dashboard', icon: 'space_dashboard', link: ['/app/manager/dashboard'] },
        { label: 'Reports', icon: 'insights', link: ['/app/manager/reports'] },
        { label: 'Staff', icon: 'groups', link: ['/app/manager/staff'] },
        { label: 'Check-in', icon: 'login', link: ['/app/staff/checkin'] },
        { label: 'Check-out', icon: 'logout', link: ['/app/staff/checkout'] },
        { label: 'Walk-In', icon: 'hail', link: ['/app/staff/walk-in'] },
        { label: 'Bookings', icon: 'book_online', link: ['/app/bookings'] },
        { label: 'Billing', icon: 'receipt_long', link: ['/app/billing'] },
      ];
    case 'Admin':
      return [
        { label: 'Dashboard', icon: 'space_dashboard', link: ['/app/admin/dashboard'] },
        { label: 'Users', icon: 'manage_accounts', link: ['/app/admin/users'] },
        { label: 'Configuration', icon: 'tune', link: ['/app/admin/config'] },
        { label: 'Audit', icon: 'history', link: ['/app/admin/audit'] },
        { label: 'Check-in', icon: 'login', link: ['/app/staff/checkin'] },
        { label: 'Check-out', icon: 'logout', link: ['/app/staff/checkout'] },
        { label: 'Walk-In', icon: 'hail', link: ['/app/staff/walk-in'] },
        { label: 'Bookings', icon: 'book_online', link: ['/app/bookings'] },
        { label: 'Billing', icon: 'receipt_long', link: ['/app/billing'] },
      ];
    default:
      return [];
  }
}
