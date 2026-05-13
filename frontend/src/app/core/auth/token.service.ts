import { Injectable, computed, signal } from '@angular/core';
import { decodeJwtPayload, jwtExpiresAt } from '../../shared/utils/jwt.util';
import type { AuthSession } from '../models/auth.models';
import type { UserRole } from '../constants/roles';
import { isUserRole } from '../constants/roles';

const STORAGE_TOKEN = 'hms.accessToken';
const STORAGE_SESSION = 'hms.session';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly accessToken = signal<string | null>(this.readStoredToken());
  private readonly sessionSnapshot = signal<AuthSession | null>(this.readStoredSession());

  readonly token = this.accessToken.asReadonly();
  readonly session = this.sessionSnapshot.asReadonly();

  readonly isExpired = computed(() => {
    const t = this.accessToken();
    if (!t) return true;
    const exp = jwtExpiresAt(t);
    if (!exp) return false;
    return exp.getTime() <= Date.now() + 5000;
  });

  getAccessToken(): string | null {
    return this.accessToken();
  }

  persistFromLogin(session: AuthSession): void {
    sessionStorage.setItem(STORAGE_TOKEN, session.token);
    sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
    this.accessToken.set(session.token);
    this.sessionSnapshot.set(session);
    this.scheduleExpiryWarning(session.token);
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_TOKEN);
    sessionStorage.removeItem(STORAGE_SESSION);
    this.accessToken.set(null);
    this.sessionSnapshot.set(null);
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  hydrateFromStorage(): void {
    const t = this.readStoredToken();
    const s = this.readStoredSession();
    this.accessToken.set(t);
    this.sessionSnapshot.set(s);
    if (t) this.scheduleExpiryWarning(t);
  }

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  private scheduleExpiryWarning(token: string): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    const exp = jwtExpiresAt(token);
    if (!exp) return;
    const ms = exp.getTime() - Date.now() - 60_000;
    if (ms <= 0) return;
    this.expiryTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('hms:session-expiring'));
    }, ms);
  }

  private readStoredToken(): string | null {
    return sessionStorage.getItem(STORAGE_TOKEN);
  }

  private readStoredSession(): AuthSession | null {
    const raw = sessionStorage.getItem(STORAGE_SESSION);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed?.token || !isUserRole(parsed.role)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  enrichEmailFromJwt(): void {
    const t = this.accessToken();
    const s = this.sessionSnapshot();
    if (!t || !s) return;
    const payload = decodeJwtPayload(t);
    const email = typeof payload?.email === 'string' ? payload.email : undefined;
    if (!email || s.email === email) return;
    const next: AuthSession = { ...s, email };
    sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(next));
    this.sessionSnapshot.set(next);
  }
}
