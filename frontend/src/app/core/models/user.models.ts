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

export interface GuestListDto {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  totalBookings: number;
  isLocked: boolean;
  isActive: boolean;
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
  isLocked: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStaffDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  employeeId: string;
  department: string;
  role: string;
}

export interface UpdateStaffDto {
  firstName: string;
  lastName: string;
  department: string;
  role: string;
}

export interface GuestStatsDto {
  totalStays: number;
  totalSpend: number;
  tier: 'Bronze' | 'Silver' | 'Gold';
}

export interface UpdateGuestProfileDto {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}
