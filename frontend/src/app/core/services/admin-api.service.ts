import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { HotelSummaryDto } from '../models/hotel.models';
import type { StaffUserDto } from '../models/user.models';

/** Maps to existing AdminController endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Admin`;

  getHotels(): Observable<HotelSummaryDto[]> {
    return this.http.get<HotelSummaryDto[]>(`${this.base}/hotels`);
  }

  getStaff(): Observable<StaffUserDto[]> {
    return this.http.get<StaffUserDto[]>(`${this.base}/staff`);
  }

  getStaffById(id: number): Observable<StaffUserDto> {
    return this.http.get<StaffUserDto>(`${this.base}/staff/${id}`);
  }
}
