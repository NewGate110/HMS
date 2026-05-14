import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { RoomsApiService } from '../../../core/services/rooms-api.service';
import { environment } from '../../../../environments/environment';
import type { HotelSummaryDto } from '../../../core/models/hotel.models';
import type { RoomDto } from '../../../core/models/room.models';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppEmptyStateComponent } from '../../../shared/ui/app-empty-state/app-empty-state.component';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { toYmd } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-room-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatTableModule,
    AppCardComponent,
    AppLoaderComponent,
    AppEmptyStateComponent,
    AppTableComponent,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-6xl space-y-6 px-4 py-12 text-zinc-900">
      <h1 class="text-3xl font-semibold tracking-tight">Room availability</h1>
      <app-card title="Search">
        <form class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-6" [formGroup]="form" (ngSubmit)="search()">
          <mat-form-field appearance="outline">
            <mat-label>Hotel</mat-label>
            <mat-select formControlName="hotelId">
              @for (h of hotels(); track h.id) {
                <mat-option [value]="h.id">{{ h.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Check-in</mat-label>
            <input matInput [matDatepicker]="ci" formControlName="checkIn" />
            <mat-datepicker-toggle matIconSuffix [for]="ci" />
            <mat-datepicker #ci />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Check-out</mat-label>
            <input matInput [matDatepicker]="co" formControlName="checkOut" />
            <mat-datepicker-toggle matIconSuffix [for]="co" />
            <mat-datepicker #co />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Min guests</mat-label>
            <input matInput type="number" formControlName="minCapacity" min="1" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Min price ($)</mat-label>
            <input matInput type="number" formControlName="minPrice" min="0" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Max price ($)</mat-label>
            <input matInput type="number" formControlName="maxPrice" min="0" />
          </mat-form-field>
          <div class="flex items-end md:col-span-2 lg:col-span-6">
            <app-button variant="primary" type="submit" [disabled]="loading()">
              Search availability
            </app-button>
          </div>
        </form>
      </app-card>
      @if (loading()) {
        <app-loader caption="Searching rooms…" />
      } @else if (rooms().length === 0 && searched()) {
        <app-empty-state
          icon="hotel"
          title="No rooms found"
          hint="Try different dates or a lower minimum capacity."
        />
      } @else if (rooms().length) {
        <app-table>
          <table mat-table [dataSource]="rooms()" class="w-full">
            <ng-container matColumnDef="roomNumber">
              <th mat-header-cell *matHeaderCellDef>Room</th>
              <td mat-cell *matCellDef="let r">{{ r.roomNumber }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let r">{{ r.type }}</td>
            </ng-container>
            <ng-container matColumnDef="capacity">
              <th mat-header-cell *matHeaderCellDef>Capacity</th>
              <td mat-cell *matCellDef="let r">{{ r.capacity }}</td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>From</th>
              <td mat-cell *matCellDef="let r">\${{ r.priceOffPeak }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <a [routerLink]="['/rooms', r.id]" [queryParams]="searchedDates()" class="text-sm font-medium text-zinc-900 underline-offset-4 hover:underline">Details</a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        </app-table>
      }
    </div>
  `,
})
export class RoomSearchComponent {
  private readonly fb = inject(FormBuilder);
  private readonly hotelsApi = inject(HotelsApiService);
  private readonly roomsApi = inject(RoomsApiService);

  readonly cols = ['roomNumber', 'type', 'capacity', 'price', 'actions'];
  readonly hotels = signal<HotelSummaryDto[]>([]);
  readonly rooms = signal<RoomDto[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly searchedDates = signal<{ checkIn?: string; checkOut?: string } | null>(null);

  readonly form = this.fb.nonNullable.group({
    hotelId: [environment.defaultHotelId, Validators.required],
    checkIn: [new Date(), Validators.required],
    checkOut: [new Date(Date.now() + 86400000), Validators.required],
    minCapacity: [1, [Validators.required, Validators.min(1)]],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
  });

  constructor() {
    this.hotelsApi.getAll().subscribe({
      next: (h) => {
        this.hotels.set(h);
        if (h.length && !this.form.controls.hotelId.value) {
          this.form.patchValue({ hotelId: h[0]!.id });
        }
      },
      error: () => this.hotels.set([]),
    });
  }

  search(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const checkIn = toYmd(v.checkIn);
    const checkOut = toYmd(v.checkOut);
    if (checkOut <= checkIn) return;
    this.searchedDates.set({ checkIn, checkOut });
    this.loading.set(true);
    this.searched.set(true);
    this.roomsApi
      .searchAvailable({
        hotelId: v.hotelId,
        checkIn,
        checkOut,
        minCapacity: v.minCapacity,
        minPrice: v.minPrice ?? undefined,
        maxPrice: v.maxPrice ?? undefined,
      })
      .subscribe({
        next: (r) => {
          this.rooms.set(r);
          this.loading.set(false);
        },
        error: () => {
          this.rooms.set([]);
          this.loading.set(false);
        },
      });
  }

}
