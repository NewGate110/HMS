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
  /** JWT is set as an HttpOnly cookie by the server; also returned here for Swagger testing. */
  token: string;
  expiresAt: string;
  userId: number;
  role: UserRole;
  fullName: string;
  /** Returned in body so Angular does not need to decode the JWT. */
  email: string;
  requiresPasswordChange: boolean;
}

/**
 * Metadata stored in sessionStorage — does NOT include the JWT token.
 * The token lives exclusively in the HttpOnly 'hms.auth' cookie.
 */
export interface AuthSession {
  expiresAt: string;
  userId: number;
  role: UserRole;
  fullName: string;
  email: string;
  requiresPasswordChange: boolean;
}
