import type { UserRole } from '../constants/roles';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterGuestRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  userId: number;
  role: UserRole;
  fullName: string;
  requiresPasswordChange: boolean;
}

export interface AuthSession {
  token: string;
  expiresAt: string;
  userId: number;
  role: UserRole;
  fullName: string;
  email?: string;
  requiresPasswordChange: boolean;
}
