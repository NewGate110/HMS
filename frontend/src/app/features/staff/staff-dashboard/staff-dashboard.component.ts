import { SlicePipe } from '@angular/common';
import { FormatTypePipe } from '../../../shared/pipes/format-type.pipe';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';
import type { BookingDto } from '../../../core/models/booking.models';
import type { RoomDto } from '../../../core/models/room.models';
import { AppStatCardComponent } from '../../../shared/ui/app-stat-card/app-stat-card.component';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [
    SlicePipe,
    MatTableModule,
    MatButtonModule,
    AppStatCardComponent,
    AppCardComponent,
    AppTableComponent,
    AppLoaderComponent,
    FormatTypePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">Front desk overview</h1>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-stat-card label="Arrivals today" [value]="arrivals().toString()" />
        <app-stat-card label="Departures today" [value]="departures().toString()" />
        <app-stat-card label="Occupied rooms" [value]="occupied().toString()" />
        <app-stat-card label="HK queue" [value]="hkQueue().toString()" hint="Cleaning / out of service" />
      </div>
      <app-card title="Today's movements">
        @if (loading()) {
          <app-loader caption="Loading hotel data…" />
        } @else {
          <app-table>
            <table mat-table [dataSource]="todayRows()" class="w-full">
              <ng-container matColumnDef="guest">
                <th mat-header-cell *matHeaderCellDef>Guest</th>
                <td mat-cell *matCellDef="let b">{{ b.guestName }}</td>
              </ng-container>
              <ng-container matColumnDef="room">
                <th mat-header-cell *matHeaderCellDef>Room</th>
                <td mat-cell *matCellDef="let b">
                  @if (b.rooms.length > 0) {
                    {{ b.rooms[0].roomNumber }} · {{ b.rooms[0].type | formatType }}
                  } @else {
                    —
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="guests">
                <th mat-header-cell *matHeaderCellDef>Guests</th>
                <td mat-cell *matCellDef="let b">{{ b.guestCount }}</td>
              </ng-container>
              <ng-container matColumnDef="window">
                <th mat-header-cell *matHeaderCellDef>Stay window</th>
                <td mat-cell *matCellDef="let b">
                  {{ b.checkInDate | slice: 0 : 10 }} → {{ b.checkOutDate | slice: 0 : 10 }}
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let b">{{ b.status }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
          </app-table>
        }
      </app-card>
    </div>
  `,
})
export class StaffDashboardComponent {
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly hotelsApi = inject(HotelsApiService);
  private readonly notify = inject(NotificationService);
  readonly hotelId = signal(environment.defaultHotelId);
  readonly bookings = signal<BookingDto[]>([]);
  readonly rooms = signal<RoomDto[]>([]);
  readonly loading = signal(true);
  readonly cols = ['guest', 'room', 'guests', 'window', 'status'];

  readonly todayRows = signal<BookingDto[]>([]);
  readonly arrivals = signal(0);
  readonly departures = signal(0);
  readonly occupied = signal(0);
  readonly hkQueue = signal(0);

  constructor() {
    this.hotelsApi.getAll().subscribe({
      next: (h) => {
        if (h.length) this.hotelId.set(h[0]!.id);
        this.refresh();
      },
      error: () => {
        this.loading.set(false);
        this.notify.error('Failed to load hotel data.');
      },
    });
  }

  private refresh(): void {
    const hid = this.hotelId();
    this.bookingsApi.getByHotel(hid).subscribe({
      next: (b) => {
        this.bookings.set(b);
        const today = new Date().toISOString().slice(0, 10);
        this.todayRows.set(
          b.filter((x) => x.checkInDate.startsWith(today) || x.checkOutDate.startsWith(today)),
        );
        this.arrivals.set(b.filter((x) => x.checkInDate.startsWith(today)).length);
        this.departures.set(b.filter((x) => x.checkOutDate.startsWith(today)).length);
      },
      error: () => { this.loading.set(false); this.notify.error('Failed to load bookings.'); },
    });
    this.hotelsApi.getRooms(hid).subscribe({
      next: (r) => {
        this.rooms.set(r);
        this.occupied.set(r.filter((x) => x.status === 'Occupied').length);
        this.hkQueue.set(
          r.filter((x) => x.status === 'Cleaning' || x.status === 'OutOfService').length,
        );
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.notify.error('Failed to load room data.'); },
    });
  }
}
