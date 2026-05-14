import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { HotelDto, HotelSummaryDto, UpdateHotelDto } from '../models/hotel.models';
import type { RoomDto, UpdateRoomPricingDto } from '../models/room.models';
import type { CreateStaffDto, GuestListDto, StaffUserDto, UpdateStaffDto } from '../models/user.models';

export interface AuditLogDto {
  id: number;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

/** Maps to AdminController endpoints. */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Admin`;

  // ── Hotels ────────────────────────────────────────────────────────────────
  getHotels(): Observable<HotelSummaryDto[]> {
    return this.http.get<HotelSummaryDto[]>(`${this.base}/hotels`);
  }

  updateHotel(id: number, dto: UpdateHotelDto): Observable<HotelDto> {
    return this.http.put<HotelDto>(`${this.base}/hotels/${id}`, dto);
  }

  updateRoomPricing(id: number, dto: UpdateRoomPricingDto): Observable<RoomDto> {
    return this.http.put<RoomDto>(`${this.base}/rooms/${id}/pricing`, dto);
  }

  // ── Staff CRUD ─────────────────────────────────────────────────────────────
  getStaff(): Observable<StaffUserDto[]> {
    return this.http.get<StaffUserDto[]>(`${this.base}/staff`);
  }

  getStaffById(id: number): Observable<StaffUserDto> {
    return this.http.get<StaffUserDto>(`${this.base}/staff/${id}`);
  }

  createStaff(dto: CreateStaffDto): Observable<StaffUserDto> {
    return this.http.post<StaffUserDto>(`${this.base}/staff`, dto);
  }

  updateStaff(id: number, dto: UpdateStaffDto): Observable<StaffUserDto> {
    return this.http.put<StaffUserDto>(`${this.base}/staff/${id}`, dto);
  }

  // ── Guest list ─────────────────────────────────────────────────────────────
  getGuests(): Observable<GuestListDto[]> {
    return this.http.get<GuestListDto[]>(`${this.base}/guests`);
  }

  // ── Account management ─────────────────────────────────────────────────────
  deactivateUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/deactivate`, {});
  }

  reactivateUser(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/reactivate`, {});
  }

  unlockAccount(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/unlock`, {});
  }

  forcePasswordChange(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${id}/force-password-change`, {});
  }

  // ── Audit logs ─────────────────────────────────────────────────────────────
  getAuditLogs(count = 100): Observable<AuditLogDto[]> {
    return this.http.get<AuditLogDto[]>(`${this.base}/audit-logs`, { params: { count } });
  }
}
