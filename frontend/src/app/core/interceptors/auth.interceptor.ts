/**
 * authInterceptor — attaches withCredentials: true to every API request so the
 * browser automatically includes the HttpOnly 'hms.auth' cookie.  No token is
 * read or injected by JavaScript; the cookie travels transparently.
 */
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiRoot)) {
    return next(req);
  }
  return next(req.clone({ withCredentials: true }));
};
