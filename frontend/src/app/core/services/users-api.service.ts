import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { BookingDto } from '../models/booking.models';
import type { GuestListDto, GuestStatsDto, GuestUserDto, StaffUserDto, UpdateGuestProfileDto } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Users`;

  getGuest(id: number): Observable<GuestUserDto> {
    return this.http.get<GuestUserDto>(`${this.base}/guests/${id}`);
  }

  getGuestStats(id: number): Observable<GuestStatsDto> {
    return this.http.get<GuestStatsDto>(`${this.base}/guests/${id}/stats`);
  }

  searchGuests(term: string): Observable<GuestListDto[]> {
    return this.http.get<GuestListDto[]>(`${this.base}/guests/search`, { params: { term } });
  }

  updateGuest(id: number, body: UpdateGuestProfileDto): Observable<GuestUserDto> {
    return this.http.put<GuestUserDto>(`${this.base}/guests/${id}`, body);
  }

  getGuestBookings(id: number): Observable<BookingDto[]> {
    return this.http.get<BookingDto[]>(`${this.base}/guests/${id}/bookings`);
  }

  getAllStaff(): Observable<StaffUserDto[]> {
    return this.http.get<StaffUserDto[]>(`${this.base}/staff`);
  }

  getStaff(id: number): Observable<StaffUserDto> {
    return this.http.get<StaffUserDto>(`${this.base}/staff/${id}`);
  }
}
