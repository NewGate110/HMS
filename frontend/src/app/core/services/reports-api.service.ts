import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { OccupancyReportDto, RevenueReportDto, StaffPerformanceDto } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Reports`;

  getOccupancy(hotelId: number, from: string, to: string): Observable<OccupancyReportDto> {
    const params = new HttpParams()
      .set('hotelId', String(hotelId))
      .set('from', from)
      .set('to', to);
    return this.http.get<OccupancyReportDto>(`${this.base}/occupancy`, { params });
  }

  getRevenue(hotelId: number, from: string, to: string): Observable<RevenueReportDto> {
    const params = new HttpParams()
      .set('hotelId', String(hotelId))
      .set('from', from)
      .set('to', to);
    return this.http.get<RevenueReportDto>(`${this.base}/revenue`, { params });
  }

  getStaffPerformance(hotelId: number): Observable<StaffPerformanceDto[]> {
    const params = new HttpParams().set('hotelId', String(hotelId));
    return this.http.get<StaffPerformanceDto[]>(`${this.base}/staff-performance`, { params });
  }
}
