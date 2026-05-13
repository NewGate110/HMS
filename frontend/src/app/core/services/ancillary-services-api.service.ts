import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AncillaryServiceDto } from '../models/service.models';

@Injectable({ providedIn: 'root' })
export class AncillaryServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiRoot}/Services`;

  getAll(): Observable<AncillaryServiceDto[]> {
    return this.http.get<AncillaryServiceDto[]>(this.base);
  }

  getById(id: number): Observable<AncillaryServiceDto> {
    return this.http.get<AncillaryServiceDto>(`${this.base}/${id}`);
  }
}
