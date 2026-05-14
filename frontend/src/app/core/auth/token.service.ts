/**
 * TokenService — manages the user's session metadata.
 *
 * The JWT itself lives exclusively in the HttpOnly 'hms.auth' cookie set by the
 * server on login/register and cleared on logout.  This service never reads or
 * writes the token value; it only persists the non-sensitive session metadata
 * (userId, role, fullName, email, expiresAt) so the Angular app can drive its UI
 * without decoding the cookie (which JS cannot access by design).
 */
import { Injectable, computed, signal } from '@angular/core';
import type { AuthSession } from '../models/auth.models';
import { isUserRole } from '../constants/roles';

const STORAGE_SESSION = 'hms.session';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly sessionSnapshot = signal<AuthSession | null>(this.readStoredSession());

  readonly session = this.sessionSnapshot.asReadonly();

  /** True when the stored expiresAt timestamp is within 5 seconds of now (or absent). */
  readonly isExpired = computed(() => {
    const s = this.sessionSnapshot();
    if (!s?.expiresAt) return true;
    return new Date(s.expiresAt).getTime() <= Date.now() + 5000;
  });

  /** Persist session metadata to sessionStorage and schedule the expiry warning. */
  persistFromLogin(session: AuthSession): void {
    sessionStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
    this.sessionSnapshot.set(session);
    this.scheduleExpiryWarning(session.expiresAt);
  }

  /** Clear session metadata (cookie is cleared by the server's logout endpoint). */
  clear(): void {
    sessionStorage.removeItem(STORAGE_SESSION);
    this.sessionSnapshot.set(null);
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  /** Re-hydrate from sessionStorage on app start (e.g. page refresh). */
  hydrateFromStorage(): void {
    const s = this.readStoredSession();
    this.sessionSnapshot.set(s);
    if (s) this.scheduleExpiryWarning(s.expiresAt);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  /** Fire the 'hms:session-expiring' event 60 seconds before the token expires. */
  private scheduleExpiryWarning(expiresAt: string): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    const exp = new Date(expiresAt);
    const ms = exp.getTime() - Date.now() - 60_000;
    if (ms <= 0) return;
    this.expiryTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('hms:session-expiring'));
    }, ms);
  }

  private readStoredSession(): AuthSession | null {
    const raw = sessionStorage.getItem(STORAGE_SESSION);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as AuthSession;
      if (!isUserRole(parsed.role) || !parsed.expiresAt) return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
