import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { RoomDto, RoomSearchResponse } from '../models/room.models';

@Injectable({ providedIn: 'root' })
export class RoomsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Rooms`;

  getById(id: number): Observable<RoomDto> {
    return this.http.get<RoomDto>(`${this.base}/${id}`);
  }

  searchAvailable(params: {
    hotelId: number;
    checkIn: string;
    checkOut: string;
    minCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<RoomDto[]> {
    let hp = new HttpParams()
      .set('hotelId', String(params.hotelId))
      .set('checkIn', params.checkIn)
      .set('checkOut', params.checkOut);
    if (params.minCapacity != null) hp = hp.set('minCapacity', String(params.minCapacity));
    if (params.minPrice    != null) hp = hp.set('minPrice',    String(params.minPrice));
    if (params.maxPrice    != null) hp = hp.set('maxPrice',    String(params.maxPrice));
    return this.http.get<RoomDto[]>(`${this.base}/available`, { params: hp });
  }

  getUnavailableDates(roomId: number): Observable<{ from: string; to: string }[]> {
    return this.http.get<{ from: string; to: string }[]>(`${this.base}/${roomId}/unavailable-dates`);
  }

  searchRooms(params: {
    location?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    roomType?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Observable<RoomSearchResponse> {
    let hp = new HttpParams();
    if (params.location)              hp = hp.set('location',  params.location);
    if (params.checkIn)               hp = hp.set('checkIn',   params.checkIn);
    if (params.checkOut)              hp = hp.set('checkOut',  params.checkOut);
    if (params.guests   != null)      hp = hp.set('guests',    String(params.guests));
    if (params.roomType)              hp = hp.set('roomType',  params.roomType);
    if (params.minPrice != null)      hp = hp.set('minPrice',  String(params.minPrice));
    if (params.maxPrice != null)      hp = hp.set('maxPrice',  String(params.maxPrice));
    return this.http.get<RoomSearchResponse>(`${this.base}/search`, { params: hp });
  }
}
