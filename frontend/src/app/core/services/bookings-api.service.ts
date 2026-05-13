import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { BookingDto, CreateBookingDto } from '../models/booking.models';
import type { InvoiceDto } from '../models/invoice.models';
import type { PaymentDto } from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class BookingsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Bookings`;

  getById(id: number): Observable<BookingDto> {
    return this.http.get<BookingDto>(`${this.base}/${id}`);
  }

  getByGuest(guestId: number): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.base}/guest/${guestId}`);
  }

  getByHotel(hotelId: number): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.base}/hotel/${hotelId}`);
  }

  create(guestId: number, body: CreateBookingDto): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/guest/${guestId}`, body);
  }

  cancel(id: number): Observable<BookingDto> {
    return this.http.post<BookingDto>(`${this.base}/${id}/cancel`, {});
  }

  getPayments(bookingId: number): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(`${this.base}/${bookingId}/payments`);
  }

  getInvoice(bookingId: number): Observable<InvoiceDto> {
    return this.http.get<InvoiceDto>(`${this.base}/${bookingId}/invoice`);
  }
}
