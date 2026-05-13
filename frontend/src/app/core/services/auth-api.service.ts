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
}
