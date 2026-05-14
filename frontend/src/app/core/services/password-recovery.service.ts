/**
 * PasswordRecoveryService — thin wrapper around AuthApiService for the
 * forgot-password / reset-password flows.
 *
 * Dev/demo mode: the server returns the plain reset token in the response body
 * (no email is sent).  The forgot-password component shows the token so the
 * tester can copy it into the reset-password URL (?token=...).
 */
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { AuthApiService } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  private readonly authApi = inject(AuthApiService);

  /**
   * Requests a reset token for the given email.
   * Returns `{ message, resetToken }` — in dev mode `resetToken` is the plain token.
   */
  requestReset(email: string): Observable<{ message: string; resetToken: string }> {
    return this.authApi.forgotPassword(email);
  }

  /** Submits the new password together with the reset token. */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.authApi.resetPassword(token, newPassword);
  }
}
