import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TokenService } from '../auth/token.service';

function isAnonymousAuthUrl(url: string): boolean {
  return url.includes('/Auth/login') || url.includes('/Auth/register');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenService);
  const token = tokens.getAccessToken();
  const isApi = req.url.startsWith(environment.apiRoot);
  if (!isApi || isAnonymousAuthUrl(req.url) || !token) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
