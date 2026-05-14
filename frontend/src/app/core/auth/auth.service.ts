import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';
import type { AuthSession, LoginRequest, LoginResponse, RegisterGuestRequest } from '../models/auth.models';
import type { UserRole } from '../constants/roles';
import { isUserRole, roleDashboardPath } from '../constants/roles';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  private readonly session = this.tokens.session;

  readonly userId   = computed(() => this.session()?.userId   ?? null);
  readonly role     = computed(() => this.session()?.role     ?? null);
  readonly fullName = computed(() => this.session()?.fullName ?? null);
  readonly email    = computed(() => this.session()?.email    ?? null);
  readonly requiresPasswordChange = computed(() => this.session()?.requiresPasswordChange ?? false);

  /** True when session metadata is present and the token has not yet expired. */
  readonly isAuthenticated = computed(() => {
    if (!this.session()) return false;
    return !this.tokens.isExpired();
  });

  constructor() {
    // Re-hydrate session metadata from sessionStorage on page refresh.
    // The actual JWT travels as an HttpOnly cookie — no JS access needed.
    this.tokens.hydrateFromStorage();

    if (typeof window !== 'undefined') {
      window.addEventListener('hms:session-expiring', () => {
        /* optional: toast via NotificationService when wired */
      });
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.authApi.login(credentials).pipe(
      tap((res) => {
        if (!isUserRole(res.role)) return;
        this.tokens.persistFromLogin(this.toSession(res));
      }),
    );
  }

  register(body: RegisterGuestRequest): Observable<LoginResponse> {
    return this.authApi.register(body).pipe(
      tap((res) => {
        if (!isUserRole(res.role)) return;
        this.tokens.persistFromLogin(this.toSession(res));
      }),
    );
  }

  /**
   * Calls the server logout endpoint (which clears the HttpOnly cookie),
   * then clears local session metadata and navigates to login.
   */
  logout(): void {
    this.authApi.logout().subscribe({ complete: () => {}, error: () => {} });
    this.tokens.clear();
    void this.router.navigateByUrl('/login');
  }

  navigateAfterLogin(role: UserRole): void {
    void this.router.navigateByUrl(roleDashboardPath(role));
  }

  private toSession(res: LoginResponse): AuthSession {
    return {
      expiresAt:             res.expiresAt,
      userId:                res.userId,
      role:                  res.role,
      fullName:              res.fullName,
      email:                 res.email,
      requiresPasswordChange: res.requiresPasswordChange,
    };
  }
}
