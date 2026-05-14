import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { map } from 'rxjs/operators';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import type { DateFilterFn, MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { AuthService } from '../../../core/auth/auth.service';
import { RoomsApiService } from '../../../core/services/rooms-api.service';
import { AncillaryServicesApiService } from '../../../core/services/ancillary-services-api.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import type { RoomDto } from '../../../core/models/room.models';
import type { AncillaryServiceDto } from '../../../core/models/service.models';
import type { BookingDto } from '../../../core/models/booking.models';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppBadgeComponent } from '../../../shared/ui/app-badge/app-badge.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { FormatTypePipe } from '../../../shared/pipes/format-type.pipe';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    NgClass,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    AppCardComponent,
    AppLoaderComponent,
    AppBadgeComponent,
    AppButtonComponent,
    FormatTypePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-6xl px-4 py-12 text-zinc-900">
      @if (loading()) {
        <app-loader />
      } @else if (room()) {
        @let r = room()!;
        <div class="lg:grid lg:grid-cols-[1fr_380px] lg:gap-10 lg:items-start">
          <!-- ── LEFT: Room info ── -->
          <div class="space-y-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="text-sm text-zinc-500">{{ r.hotelName }}</p>
                <h1 class="text-3xl font-semibold tracking-tight">Room {{ r.roomNumber }}</h1>
                <div class="mt-2 flex flex-wrap gap-2">
                  <app-badge tone="info">{{ r.type | formatType }}</app-badge>
                  <app-badge>{{ r.status }}</app-badge>
                </div>
              </div>
              <a routerLink="/rooms/search" class="inline-block">
                <app-button variant="secondary" type="button">Back to search</app-button>
              </a>
            </div>

            <app-card title="Overview">
              <p class="text-sm leading-relaxed text-zinc-600">
                {{ r.description || 'Premium room with curated amenities.' }}
              </p>
              <dl class="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt class="text-zinc-500">Capacity</dt>
                  <dd class="font-medium">{{ r.capacity }} guests</dd>
                </div>
                <div>
                  <dt class="text-zinc-500">Floor</dt>
                  <dd class="font-medium">{{ r.floorNumber }}</dd>
                </div>
                <div>
                  <dt class="text-zinc-500">Off-peak from</dt>
                  <dd class="font-medium">&#36;{{ r.priceOffPeak }}</dd>
                </div>
                <div>
                  <dt class="text-zinc-500">Peak from</dt>
                  <dd class="font-medium">&#36;{{ r.pricePeak }}</dd>
                </div>
              </dl>
            </app-card>
          </div>

          <!-- ── RIGHT: Booking panel ── -->
          <div class="mt-8 lg:mt-0 lg:sticky lg:top-8">
            <div class="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              @if (!auth.isAuthenticated()) {
                <!-- Unauthenticated -->
                <p class="text-base font-semibold text-zinc-800">Ready to book?</p>
                <p class="mt-1 text-sm text-zinc-500">Sign in to start your reservation.</p>
                <a
                  [routerLink]="['/login']"
                  [queryParams]="{ returnUrl: '/rooms/' + r.id }"
                  class="mt-4 block"
                >
                  <app-button variant="primary" type="button">Sign in to book</app-button>
                </a>
              } @else if (auth.role() !== 'Guest') {
                <!-- Staff / admin -->
                <div class="flex items-start gap-2 text-sm text-zinc-500">
                  <span
                    class="material-icons-outlined mt-0.5 text-base text-amber-400"
                    aria-hidden="true"
                    >info</span
                  >
                  Reservations are available to registered guests only.
                </div>
              } @else if (bookingSuccess()) {
                <!-- Booking confirmed -->
                @let b = bookingSuccess()!;
                <div class="space-y-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100"
                    >
                      <span
                        class="material-icons-outlined text-xl text-emerald-600"
                        aria-hidden="true"
                        >check</span
                      >
                    </div>
                    <div>
                      <p class="font-semibold text-zinc-800">Booking confirmed!</p>
                      <p class="text-xs text-zinc-400">Reference #{{ b.id }}</p>
                    </div>
                  </div>
                  <div class="rounded-xl bg-zinc-50 p-4 text-sm space-y-2">
                    <div class="flex justify-between text-zinc-600">
                      <span>Check-in</span><span class="font-medium">{{ b.checkInDate }}</span>
                    </div>
                    <div class="flex justify-between text-zinc-600">
                      <span>Check-out</span><span class="font-medium">{{ b.checkOutDate }}</span>
                    </div>
                    <div
                      class="flex justify-between border-t border-zinc-100 pt-2 font-semibold text-zinc-900"
                    >
                      <span>Total</span><span>&#36;{{ b.totalAmount }}</span>
                    </div>
                  </div>
                  <a routerLink="/app/bookings" class="block">
                    <app-button variant="secondary" type="button">View my bookings</app-button>
                  </a>
                </div>
              } @else {
                <!-- Booking wizard (Guest) -->

                <!-- Step indicators -->
                <div class="mb-5 flex items-center" role="list" aria-label="Booking steps">
                  @for (s of [1, 2, 3]; track s) {
                    <div class="flex items-center" role="listitem">
                      <div
                        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors"
                        [ngClass]="
                          step() >= s ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
                        "
                        [attr.aria-current]="step() === s ? 'step' : null"
                      >
                        {{ s }}
                      </div>
                      <span class="ml-1 hidden text-xs text-zinc-400 sm:inline">
                        @if (s === 1) {
                          Dates
                        } @else if (s === 2) {
                          Add-ons
                        } @else {
                          Review
                        }
                      </span>
                      @if (s < 3) {
                        <div class="mx-2 h-px w-5 shrink-0 bg-zinc-200"></div>
                      }
                    </div>
                  }
                </div>

                <!-- ── Step 1: Dates ── -->
                @if (step() === 1) {
                  <p class="mb-3 text-sm font-semibold text-zinc-700">Select your dates</p>

                  @if (availabilityLoading()) {
                    <p class="mb-2 text-xs text-zinc-400">Loading availability…</p>
                  }

                  <mat-form-field appearance="outline" class="w-full">
                    <mat-label>Stay dates</mat-label>
                    <mat-date-range-input
                      [rangePicker]="picker"
                      [dateFilter]="dateFilter"
                      [min]="minDate"
                      [formGroup]="dateRange"
                    >
                      <input
                        matStartDate
                        formControlName="start"
                        placeholder="Check-in"
                        aria-label="Check-in date"
                      />
                      <input
                        matEndDate
                        formControlName="end"
                        placeholder="Check-out"
                        aria-label="Check-out date"
                      />
                    </mat-date-range-input>
                    <mat-datepicker-toggle matIconSuffix [for]="picker" />
                    <mat-date-range-picker #picker [dateClass]="dateClass" />
                  </mat-form-field>

                  <!-- Guest count -->
                  <div class="mt-3">
                    <label class="mb-1 block text-xs font-medium text-zinc-600">
                      Guests
                      <span class="font-normal text-zinc-400">(max {{ r.capacity }})</span>
                    </label>
                    <div class="flex items-center gap-3">
                      <button
                        type="button"
                        (click)="guestCount.update(n => Math.max(1, n - 1))"
                        [disabled]="guestCount() <= 1"
                        class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40"
                        aria-label="Decrease guest count"
                      >−</button>
                      <span class="w-6 text-center text-sm font-semibold text-zinc-800">{{ guestCount() }}</span>
                      <button
                        type="button"
                        (click)="guestCount.update(n => Math.min(r.capacity, n + 1))"
                        [disabled]="guestCount() >= r.capacity"
                        class="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40"
                        aria-label="Increase guest count"
                      >+</button>
                    </div>
                  </div>

                  @if (nights() > 0) {
                    <div class="mt-3 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm">
                      <div class="flex justify-between text-zinc-600">
                        <span
                          >&#36;{{ r.priceOffPeak }} × {{ nights() }} night{{
                            nights() === 1 ? '' : 's'
                          }}</span
                        >
                        <span class="font-semibold text-zinc-900">&#36;{{ roomTotal() }}</span>
                      </div>
                    </div>
                  }

                  @if (dateRangeError()) {
                    <p class="mt-2 text-xs text-red-500" role="alert">{{ dateRangeError() }}</p>
                  }

                  <button
                    type="button"
                    (click)="goToStep2()"
                    [disabled]="!checkIn() || !checkOut()"
                    class="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Continue
                  </button>
                }

                <!-- ── Step 2: Add-ons ── -->
                @if (step() === 2) {
                  <p class="mb-3 text-sm font-semibold text-zinc-700">
                    Add-on services <span class="font-normal text-zinc-400">(optional)</span>
                  </p>

                  @if (services().length === 0) {
                    <p class="text-sm text-zinc-400">No add-on services available.</p>
                  } @else {
                    <div class="space-y-2">
                      @for (svc of services(); track svc.id) {
                        <div
                          class="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3"
                        >
                          <div class="min-w-0 flex-1 pr-3">
                            <p class="text-sm font-medium text-zinc-800">{{ svc.name }}</p>
                            <p class="mt-0.5 text-xs text-zinc-400">
                              &#36;{{ svc.fee }} / {{ svc.unit }}
                            </p>
                          </div>
                          <div class="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              (click)="setServiceQty(svc.id, getServiceQty(svc.id) - 1)"
                              [disabled]="getServiceQty(svc.id) === 0"
                              class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-40"
                              [attr.aria-label]="'Decrease ' + svc.name"
                            >
                              −
                            </button>
                            <span
                              class="w-5 text-center text-sm font-semibold text-zinc-800"
                              [attr.aria-label]="svc.name + ' quantity'"
                              >{{ getServiceQty(svc.id) }}</span
                            >
                            <button
                              type="button"
                              (click)="setServiceQty(svc.id, getServiceQty(svc.id) + 1)"
                              class="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-600 transition hover:bg-zinc-100"
                              [attr.aria-label]="'Increase ' + svc.name"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <div class="mt-4 flex gap-2">
                    <button
                      type="button"
                      (click)="back()"
                      class="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      (click)="goToStep3()"
                      class="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-700 active:scale-[0.98]"
                    >
                      Continue
                    </button>
                  </div>
                }

                <!-- ── Step 3: Review & Confirm ── -->
                @if (step() === 3) {
                  <p class="mb-3 text-sm font-semibold text-zinc-700">Review your booking</p>

                  <div class="rounded-xl bg-zinc-50 p-4 text-sm space-y-2">
                    <div class="flex justify-between text-zinc-600">
                      <span>Room</span>
                      <span class="font-medium">{{ r.roomNumber }} · {{ r.type | formatType }}</span>
                    </div>
                    <div class="flex justify-between text-zinc-600">
                      <span>Guests</span>
                      <span class="font-medium">{{ guestCount() }}</span>
                    </div>
                    <div class="flex justify-between text-zinc-600">
                      <span>Check-in</span>
                      <span class="font-medium">{{ formatDateDisplay(checkIn()) }}</span>
                    </div>
                    <div class="flex justify-between text-zinc-600">
                      <span>Check-out</span>
                      <span class="font-medium">{{ formatDateDisplay(checkOut()) }}</span>
                    </div>
                    <div class="flex justify-between text-zinc-600">
                      <span>{{ nights() }} night{{ nights() === 1 ? '' : 's' }}</span>
                      <span class="font-medium">&#36;{{ roomTotal() }}</span>
                    </div>
                    @if (servicesTotal() > 0) {
                      <div class="flex justify-between text-zinc-600">
                        <span>Add-ons</span>
                        <span class="font-medium">&#36;{{ servicesTotal() }}</span>
                      </div>
                    }
                    <div
                      class="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900"
                    >
                      <span>Total</span>
                      <span>&#36;{{ grandTotal() }}</span>
                    </div>
                  </div>

                  @if (submitError()) {
                    <p class="mt-2 text-xs text-red-500" role="alert">{{ submitError() }}</p>
                  }

                  <div class="mt-4 flex gap-2">
                    <button
                      type="button"
                      (click)="back()"
                      [disabled]="submitting()"
                      class="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      (click)="confirm()"
                      [disabled]="submitting()"
                      class="flex-1 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50"
                    >
                      @if (submitting()) {
                        Booking…
                      } @else {
                        Confirm booking
                      }
                    </button>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class RoomDetailComponent {
  protected readonly Math = Math;
  private readonly route = inject(ActivatedRoute);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly ancillaryApi = inject(AncillaryServicesApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  readonly auth = inject(AuthService);

  // Room data
  readonly room = signal<RoomDto | null>(null);
  readonly loading = signal(true);

  // Availability
  readonly unavailableDates = signal<{ from: string; to: string }[]>([]);
  readonly availabilityLoading = signal(false);

  // Booking wizard
  readonly step = signal<1 | 2 | 3>(1);
  readonly dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });
  readonly checkIn = signal<Date | null>(null);
  readonly checkOut = signal<Date | null>(null);
  readonly minDate = new Date();

  // Guest count
  readonly guestCount = signal(1);

  // Services
  readonly services = signal<AncillaryServiceDto[]>([]);
  readonly serviceQty = signal<Map<number, number>>(new Map());

  // Submission
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly bookingSuccess = signal<BookingDto | null>(null);
  readonly dateRangeError = signal<string | null>(null);

  // Computed
  readonly nights = computed(() => {
    const s = this.checkIn();
    const e = this.checkOut();
    if (!s || !e) return 0;
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
  });

  readonly roomTotal = computed(() => {
    const r = this.room();
    const n = this.nights();
    return r && n ? r.priceOffPeak * n : 0;
  });

  readonly servicesTotal = computed(() => {
    let total = 0;
    for (const [id, qty] of this.serviceQty()) {
      const svc = this.services().find((s) => s.id === id);
      if (svc && qty > 0) total += svc.fee * qty;
    }
    return total;
  });

  readonly grandTotal = computed(() => this.roomTotal() + this.servicesTotal());

  readonly dateFilter: DateFilterFn<Date | null> = (d: Date | null) => {
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return false;
    const ymd = this.toYmd(d);
    return !this.unavailableDates().some((r) => ymd >= r.from && ymd < r.to);
  };

  readonly dateClass: MatCalendarCellClassFunction<Date> = (d) => {
    const ymd = this.toYmd(d);
    return this.unavailableDates().some((r) => ymd >= r.from && ymd < r.to)
      ? 'cal-unavailable'
      : '';
  };

  constructor() {
    this.dateRange.controls.start.valueChanges.subscribe((v) => {
      this.checkIn.set(v);
      this.dateRangeError.set(null);
    });
    this.dateRange.controls.end.valueChanges.subscribe((v) => {
      this.checkOut.set(v);
      this.dateRangeError.set(null);
    });

    this.route.paramMap.pipe(map((p) => Number(p.get('id')))).subscribe((id) => {
      if (!Number.isFinite(id)) {
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.roomsApi.getById(id).subscribe({
        next: (r) => {
          this.room.set(r);
          this.loading.set(false);
        },
        error: () => {
          this.room.set(null);
          this.loading.set(false);
        },
      });

      this.availabilityLoading.set(true);
      this.roomsApi.getUnavailableDates(id).subscribe({
        next: (dates) => {
          this.unavailableDates.set(dates);
          this.availabilityLoading.set(false);
        },
        error: () => this.availabilityLoading.set(false),
      });
    });

    this.ancillaryApi.getAll().subscribe({
      next: (s) => this.services.set(s),
      error: () => this.services.set([]),
    });

    const qp = this.route.snapshot.queryParamMap;
    const ciStr = qp.get('checkIn');
    const coStr = qp.get('checkOut');
    if (ciStr && coStr) {
      const ci = this.parseYmd(ciStr);
      const co = this.parseYmd(coStr);
      if (ci && co && co > ci) {
        this.dateRange.setValue({ start: ci, end: co });
      }
    }
  }

  goToStep2(): void {
    const ci = this.checkIn();
    const co = this.checkOut();
    if (!ci || !co) {
      this.dateRangeError.set('Please select your check-in and check-out dates.');
      return;
    }
    if (co <= ci) {
      this.dateRangeError.set('Check-out must be after check-in.');
      return;
    }
    const sYmd = this.toYmd(ci);
    const eYmd = this.toYmd(co);
    const overlaps = this.unavailableDates().some((r) => sYmd < r.to && eYmd > r.from);
    if (overlaps) {
      this.dateRangeError.set(
        'Your selected dates overlap with an existing booking. Please choose different dates.',
      );
      return;
    }
    this.dateRangeError.set(null);
    this.step.set(2);
  }

  goToStep3(): void {
    this.step.set(3);
  }

  back(): void {
    this.step.update((s) => Math.max(1, s - 1) as 1 | 2 | 3);
  }

  setServiceQty(serviceId: number, qty: number): void {
    this.serviceQty.update((m) => {
      const next = new Map(m);
      if (qty <= 0) next.delete(serviceId);
      else next.set(serviceId, qty);
      return next;
    });
  }

  getServiceQty(serviceId: number): number {
    return this.serviceQty().get(serviceId) ?? 0;
  }

  confirm(): void {
    const r = this.room();
    const ci = this.checkIn();
    const co = this.checkOut();
    const uid = this.auth.userId();
    if (!r || !ci || !co || !uid) return;

    const services: { serviceId: number; quantity: number; serviceDate: string }[] = [];
    for (const [id, qty] of this.serviceQty()) {
      if (qty > 0) services.push({ serviceId: id, quantity: qty, serviceDate: this.toYmd(ci) });
    }

    this.submitting.set(true);
    this.submitError.set(null);
    this.bookingsApi
      .create(uid, {
        hotelId: r.hotelId,
        checkInDate: this.toYmd(ci),
        checkOutDate: this.toYmd(co),
        roomIds: [r.id],
        services,
        notes: '',
        guestCount: this.guestCount(),
      })
      .subscribe({
        next: (booking) => {
          this.bookingSuccess.set(booking);
          this.submitting.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitError.set(err?.error?.message ?? 'Booking failed. Please try again.');
          this.submitting.set(false);
        },
      });
  }

  formatDateDisplay(d: Date | null): string {
    if (!d) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private parseYmd(s: string): Date | null {
    const parts = s.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [y, m, d] = parts as [number, number, number];
    return new Date(y, m - 1, d);
  }

  private toYmd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
