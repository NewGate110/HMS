import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { HotelDto, HotelSummaryDto } from '../models/hotel.models';
import type { RoomDto } from '../models/room.models';
import type { RoomStatus } from '../constants/room-status';

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

  updateRoomStatus(hotelId: number, roomId: number, status: RoomStatus): Observable<RoomDto> {
    return this.http.patch<RoomDto>(`${this.base}/${hotelId}/rooms/${roomId}/status`, { status });
  }
}
