import { Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';

/** Placeholder until backend exposes forgot-password. */
@Injectable({ providedIn: 'root' })
export class PasswordRecoveryService {
  requestReset(email: string): Observable<{ ok: true; email: string }> {
    return of({ ok: true, email } as const).pipe(delay(600));
  }
}
