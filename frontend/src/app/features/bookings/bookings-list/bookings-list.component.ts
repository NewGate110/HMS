import { SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { environment } from '../../../../environments/environment';
import type { BookingDto } from '../../../core/models/booking.models';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [SlicePipe, AppLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">Bookings</h1>

      @if (loading()) {
        <app-loader />
      } @else if (rows().length === 0) {
        <div class="rounded-2xl border border-zinc-100 bg-white p-10 text-center shadow-sm">
          <span class="material-icons-outlined text-4xl text-zinc-300" aria-hidden="true">hotel</span>
          <p class="mt-3 text-sm font-medium text-zinc-500">No bookings yet</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (b of rows(); track b.id) {
            <div class="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <!-- Header row -->
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-mono text-zinc-400">#{{ b.id }}</span>
                    @if (b.rooms.length > 0) {
                      <span class="text-sm font-semibold text-zinc-800">
                        Room {{ b.rooms[0].roomNumber }}
                        <span class="font-normal text-zinc-400">·</span>
                        {{ formatType(b.rooms[0].type) }}
                      </span>
                    } @else {
                      <span class="text-sm font-semibold text-zinc-800">Room pending</span>
                    }
                  </div>
                  <p class="mt-0.5 text-xs text-zinc-500">
                    {{ b.hotelName || 'Hotel' }}
                    <span class="mx-1 text-zinc-300">·</span>
                    {{ b.guestName || 'Guest' }}
                    <span class="mx-1 text-zinc-300">·</span>
                    {{ b.guestCount }} {{ b.guestCount === 1 ? 'guest' : 'guests' }}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  [class]="statusClass(b.status)"
                >{{ b.status }}</span>
              </div>

              <!-- Dates -->
              <div class="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                <div class="flex items-center gap-1">
                  <span class="material-icons-outlined text-[16px] text-zinc-400" aria-hidden="true">login</span>
                  <span>{{ b.checkInDate | slice: 0 : 10 }}</span>
                </div>
                <span class="text-zinc-300">→</span>
                <div class="flex items-center gap-1">
                  <span class="material-icons-outlined text-[16px] text-zinc-400" aria-hidden="true">logout</span>
                  <span>{{ b.checkOutDate | slice: 0 : 10 }}</span>
                </div>
              </div>

              <!-- Services -->
              @if (b.services.length > 0) {
                <div class="mt-3 flex flex-wrap gap-1.5">
                  @for (svc of b.services; track svc.serviceId) {
                    <span class="rounded-lg bg-zinc-50 border border-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {{ svc.serviceName }} × {{ svc.quantity }}
                      @if (svc.totalFee) {
                        <span class="text-zinc-400">- &#36;{{ svc.totalFee }}</span>
                      }
                    </span>
                  }
                </div>
              }

              <!-- Total -->
              <div class="mt-3 flex justify-end border-t border-zinc-50 pt-3">
                <span class="text-sm font-semibold text-zinc-900">&#36;{{ b.totalAmount }}</span>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class BookingsListComponent {
  private readonly auth = inject(AuthService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly hotelsApi = inject(HotelsApiService);

  readonly rows = signal<BookingDto[]>([]);
  readonly loading = signal(true);

  constructor() {
    const role = this.auth.role();
    const uid = this.auth.userId();
    if (role === 'Guest' && uid != null) {
      this.bookingsApi.getByGuest(uid).subscribe((b) => {
        this.rows.set(b);
        this.loading.set(false);
      });
      return;
    }
    this.hotelsApi.getAll().subscribe({
      next: (h) => {
        const hid = h[0]?.id ?? environment.defaultHotelId;
        this.bookingsApi.getByHotel(hid).subscribe((b) => {
          this.rows.set(b);
          this.loading.set(false);
        });
      },
      error: () => {
        this.bookingsApi.getByHotel(environment.defaultHotelId).subscribe((b) => {
          this.rows.set(b);
          this.loading.set(false);
        });
      },
    });
  }

  formatType(type: string): string {
    return type.replace(/([A-Z])/g, ' $1').trim();
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      Confirmed:  'bg-emerald-50 text-emerald-700',
      Pending:    'bg-amber-50 text-amber-700',
      CheckedIn:  'bg-sky-50 text-sky-700',
      CheckedOut: 'bg-zinc-100 text-zinc-600',
      Cancelled:  'bg-rose-50 text-rose-600',
    };
    return map[status] ?? 'bg-zinc-100 text-zinc-600';
  }
}
