import type { UserRole } from '../constants/roles';

export interface GuestUserDto {
  id: number;
  email: string;
  role: UserRole | string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface StaffUserDto {
  id: number;
  email: string;
  role: UserRole | string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department: string;
  createdAt: string;
}

export interface UpdateGuestProfileDto {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}
