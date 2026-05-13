import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { HotelDto, HotelSummaryDto } from '../models/hotel.models';
import type { RoomDto } from '../models/room.models';

@Injectable({ providedIn: 'root' })
export class HotelsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Hotels`;

  getAll(): Observable<HotelSummaryDto[]> {
    return this.http.get<HotelSummaryDto[]>(this.base);
  }

  getById(id: number): Observable<HotelDto> {
    return this.http.get<HotelDto>(`${this.base}/${id}`);
  }

  getRooms(hotelId: number): Observable<RoomDto[]> {
    return this.http.get<RoomDto[]>(`${this.base}/${hotelId}/rooms`);
  }
}
