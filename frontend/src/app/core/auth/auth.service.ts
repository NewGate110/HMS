import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { AuthApiService } from '../services/auth-api.service';
import type { LoginRequest, LoginResponse, RegisterGuestRequest } from '../models/auth.models';
import type { UserRole } from '../constants/roles';
import { isUserRole } from '../constants/roles';
import { roleDashboardPath } from '../constants/roles';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  private readonly session = this.tokens.session;

  readonly userId = computed(() => this.session()?.userId ?? null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly fullName = computed(() => this.session()?.fullName ?? null);
  readonly email = computed(() => this.session()?.email ?? null);
  readonly requiresPasswordChange = computed(() => this.session()?.requiresPasswordChange ?? false);
  readonly isAuthenticated = computed(() => {
    const t = this.tokens.token();
    if (!t) return false;
    return !this.tokens.isExpired();
  });

  constructor() {
    this.tokens.hydrateFromStorage();
    this.tokens.enrichEmailFromJwt();
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
        this.tokens.enrichEmailFromJwt();
      }),
    );
  }

  register(body: RegisterGuestRequest): Observable<LoginResponse> {
    return this.authApi.register(body).pipe(
      tap((res) => {
        if (!isUserRole(res.role)) return;
        this.tokens.persistFromLogin(this.toSession(res));
        this.tokens.enrichEmailFromJwt();
      }),
    );
  }

  logout(): void {
    this.tokens.clear();
    void this.router.navigateByUrl('/login');
  }

  navigateAfterLogin(role: UserRole): void {
    void this.router.navigateByUrl(roleDashboardPath(role));
  }

  private toSession(res: LoginResponse) {
    return {
      token: res.token,
      expiresAt: res.expiresAt,
      userId: res.userId,
      role: res.role,
      fullName: res.fullName,
      requiresPasswordChange: res.requiresPasswordChange,
    };
  }
}
