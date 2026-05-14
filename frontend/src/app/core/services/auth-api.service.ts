import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginRequest, LoginResponse, RegisterGuestRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Auth`;

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, body);
  }

  register(body: RegisterGuestRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/register`, body);
  }

  /** Tells the server to clear the HttpOnly auth cookie. */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {});
  }

  forgotPassword(email: string): Observable<{ message: string; resetToken: string }> {
    return this.http.post<{ message: string; resetToken: string }>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.base}/reset-password`, { token, newPassword });
  }
}
