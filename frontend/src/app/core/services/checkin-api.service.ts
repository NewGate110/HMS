import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { BookingDto } from '../models/booking.models';

@Injectable({ providedIn: 'root' })
export class CheckInApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/CheckIn`;

  checkIn(bookingId: number): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/${bookingId}`, {});
  }

  checkOut(bookingId: number): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/${bookingId}/checkout`, {});
  }
}
