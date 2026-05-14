import { SlicePipe } from '@angular/common';
import { FormatTypePipe } from '../../../shared/pipes/format-type.pipe';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { UsersApiService } from '../../../core/services/users-api.service';
import type { BookingDto } from '../../../core/models/booking.models';
import type { GuestStatsDto } from '../../../core/models/user.models';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppStatCardComponent } from '../../../shared/ui/app-stat-card/app-stat-card.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppEmptyStateComponent } from '../../../shared/ui/app-empty-state/app-empty-state.component';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

@Component({
  selector: 'app-guest-dashboard',
  standalone: true,
  imports: [
    SlicePipe,
    RouterLink,
    MatTableModule,
    AppCardComponent,
    AppStatCardComponent,
    AppLoaderComponent,
    AppEmptyStateComponent,
    AppTableComponent,
    AppButtonComponent,
    FormatTypePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome back, {{ auth.fullName() }}
        </h1>
        <p class="text-sm text-zinc-500">Here is your stay snapshot.</p>
      </div>
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-stat-card label="Upcoming stays" [value]="upcoming().toString()" hint="Confirmed forward" />
        <app-stat-card label="Total spend" [value]="stats() ? '$' + stats()!.totalSpend.toFixed(2) : '—'" hint="All completed stays" />
        <app-stat-card label="Past stays" [value]="past().toString()" hint="Checked out" />
        <app-stat-card label="Programme tier"
          [value]="stats()?.tier ?? '—'"
          [hint]="tierHint()" />
      </div>
      <div class="flex flex-wrap gap-3">
        <a routerLink="/app/guest/booking" class="inline-block">
          <app-button variant="primary" type="button">New booking</app-button>
        </a>
        <a routerLink="/app/guest/profile" class="inline-block">
          <app-button variant="secondary" type="button">Profile</app-button>
        </a>
      </div>
      <app-card title="Bookings">
        @if (loading()) {
          <app-loader caption="Loading bookings…" />
        } @else if (!bookings().length) {
          <app-empty-state
            icon="event"
            title="No bookings yet"
            actionLabel="Start a booking"
            (action)="navBook()"
          />
        } @else {
          <app-table>
            <table mat-table [dataSource]="bookings()" class="w-full">
              <ng-container matColumnDef="hotel">
                <th mat-header-cell *matHeaderCellDef>Hotel</th>
                <td mat-cell *matCellDef="let b">{{ b.hotelName }}</td>
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
              <ng-container matColumnDef="dates">
                <th mat-header-cell *matHeaderCellDef>Dates</th>
                <td mat-cell *matCellDef="let b">
                  {{ b.checkInDate | slice: 0 : 10 }} → {{ b.checkOutDate | slice: 0 : 10 }}
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let b">{{ b.status }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let b">&#36;{{ b.totalAmount }}</td>
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
export class GuestDashboardComponent {
  readonly auth = inject(AuthService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly usersApi    = inject(UsersApiService);
  private readonly router      = inject(Router);

  readonly cols = ['hotel', 'room', 'guests', 'dates', 'status', 'total'];
  readonly bookings = signal<BookingDto[]>([]);
  readonly stats    = signal<GuestStatsDto | null>(null);
  readonly loading  = signal(true);

  readonly upcoming = computed(() =>
    this.bookings().filter((b) => b.status === 'Confirmed' || b.status === 'CheckedIn').length,
  );
  readonly past = computed(() => this.bookings().filter((b) => b.status === 'CheckedOut').length);

  constructor() {
    const uid = this.auth.userId();
    if (uid == null) { this.loading.set(false); return; }

    this.bookingsApi.getByGuest(uid).subscribe({
      next: (rows) => { this.bookings.set(rows); this.loading.set(false); },
      error: () => this.loading.set(false),
    });

    this.usersApi.getGuestStats(uid).subscribe({
      next: (s) => this.stats.set(s),
    });
  }

  tierHint(): string {
    const t = this.stats()?.tier;
    if (t === 'Bronze') return 'Bronze: 0–2 stays';
    if (t === 'Silver') return 'Silver: 3–9 stays';
    if (t === 'Gold')   return 'Gold: 10+ stays';
    return 'Grand Rewards';
  }

  navBook(): void {
    void this.router.navigate(['/app/guest/booking']);
  }
}
