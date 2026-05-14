import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../auth/token.service';

function messageFromError(err: HttpErrorResponse): string {
  if (typeof err.error === 'string' && err.error.length > 0) return err.error;
  if (err.error && typeof err.error === 'object') {
    const o = err.error as Record<string, unknown>;
    if (typeof o['detail'] === 'string') return o['detail'];
    if (typeof o['title'] === 'string') return o['title'];
  }
  return err.message || 'Request failed';
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snack = inject(MatSnackBar);
  const tokens = inject(TokenService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 && tokens.session()) {
          tokens.clear();
          void router.navigate(['/login'], {
            queryParams: { returnUrl: router.routerState.snapshot.url },
          });
        } else if (err.status >= 400 && err.status !== 401) {
          snack.open(messageFromError(err), 'Dismiss', {
            duration: 6000,
            panelClass: ['gp-snackbar-error'],
          });
        }
      }
      return throwError(() => err);
    }),
  );
};
