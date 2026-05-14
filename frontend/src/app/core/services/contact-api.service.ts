import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactMessageDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContactApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Contact`;

  send(dto: ContactMessageDto): Observable<void> {
    return this.http.post<void>(this.base, dto);
  }
}
