// Author: Salaams
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { RoomsApiService } from '../../../core/services/rooms-api.service';
import { UsersApiService } from '../../../core/services/users-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { GuestListDto } from '../../../core/models/user.models';
import type { HotelSummaryDto } from '../../../core/models/hotel.models';
import type { RoomDto } from '../../../core/models/room.models';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';

import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

type Step = 'guest' | 'room' | 'confirm';

@Component({
  selector: 'app-walk-in-booking',
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    AppLoaderComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatStepperModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">Walk-In Booking</h1>

      <!-- Step indicator -->
      <div class="flex items-center gap-2 text-sm">
        <span [class]="stepClass('guest')">1. Select Guest</span>
        <span class="text-zinc-300">›</span>
        <span [class]="stepClass('room')">2. Choose Room</span>
        <span class="text-zinc-300">›</span>
        <span [class]="stepClass('confirm')">3. Confirm</span>
      </div>

      <!-- ── Step 1: Guest Search ───────────────────────────────────────────── -->
      @if (step() === 'guest') {
        <div class="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm space-y-4">
          <h2 class="text-base font-semibold text-zinc-800">Find or confirm guest</h2>

          <mat-form-field class="w-full">
            <mat-label>Search by name or email</mat-label>
            <input matInput [formControl]="searchCtrl" placeholder="e.g. john or john@example.com" />
            <mat-hint>Type at least 2 characters</mat-hint>
          </mat-form-field>

          @if (searchLoading()) {
            <app-loader />
          } @else if (searchResults().length > 0) {
            <div class="space-y-1.5">
              @for (g of searchResults(); track g.id) {
                <button
                  class="w-full flex items-center justify-between rounded-xl border border-zinc-100 px-4 py-3 text-left hover:border-sky-300 hover:bg-sky-50 transition-colors"
                  [class.border-sky-400]="selectedGuest()?.id === g.id"
                  [class.bg-sky-50]="selectedGuest()?.id === g.id"
                  (click)="selectGuest(g)">
                  <div>
                    <p class="text-sm font-medium text-zinc-900">{{ g.fullName }}</p>
                    <p class="text-xs text-zinc-500">{{ g.email }}
                      @if (g.phone) { · {{ g.phone }} }
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-zinc-400">{{ g.totalBookings }} booking{{ g.totalBookings === 1 ? '' : 's' }}</span>
                    @if (selectedGuest()?.id === g.id) {
                      <span class="material-icons-outlined text-sky-600 text-[18px]">check_circle</span>
                    }
                  </div>
                </button>
              }
            </div>
          } @else if (searchCtrl.value && searchCtrl.value.length >= 2 && !searchLoading()) {
            <p class="text-sm text-zinc-500">No guests found matching "{{ searchCtrl.value }}".</p>
          }

          <div class="flex justify-end pt-2">
            <button mat-flat-button color="primary"
              [disabled]="!selectedGuest()"
              (click)="goToStep('room')">
              Next: Choose Room
            </button>
          </div>
        </div>
      }

      <!-- ── Step 2: Room Selection ─────────────────────────────────────────── -->
      @if (step() === 'room') {
        <div class="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm space-y-4">
          <h2 class="text-base font-semibold text-zinc-800">
            Booking for <span class="text-sky-700">{{ selectedGuest()?.fullName }}</span>
          </h2>

          <form [formGroup]="roomForm" class="flex flex-col gap-4">
            <!-- Hotel -->
            <mat-form-field>
              <mat-label>Hotel</mat-label>
              <mat-select formControlName="hotelId" (selectionChange)="onHotelChange()">
                @for (h of hotels(); track h.id) {
                  <mat-option [value]="h.id">{{ h.name }} — {{ h.city }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <!-- Dates -->
            <div class="flex gap-3">
              <mat-form-field class="flex-1">
                <mat-label>Check-in date</mat-label>
                <input matInput type="date" formControlName="checkInDate"
                  (change)="onDateChange()" />
              </mat-form-field>
              <mat-form-field class="flex-1">
                <mat-label>Check-out date</mat-label>
                <input matInput type="date" formControlName="checkOutDate"
                  (change)="onDateChange()" />
              </mat-form-field>
            </div>

            <!-- Guest count -->
            <mat-form-field>
              <mat-label>Number of guests</mat-label>
              <input matInput type="number" formControlName="guestCount" min="1" />
            </mat-form-field>

            <!-- Available rooms -->
            @if (roomsLoading()) {
              <app-loader />
            } @else if (availableRooms().length > 0) {
              <div>
                <p class="text-sm font-medium text-zinc-700 mb-2">Available rooms</p>
                <div class="space-y-1.5 max-h-60 overflow-y-auto">
                  @for (r of availableRooms(); track r.id) {
                    <button type="button"
                      class="w-full flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors"
                      [ngClass]="selectedRoomId() === r.id
                        ? 'border-sky-400 bg-sky-50'
                        : 'border-zinc-100 hover:border-sky-300'"
                      (click)="selectedRoomId.set(r.id)">
                      <div>
                        <p class="text-sm font-semibold text-zinc-800">
                          Room {{ r.roomNumber }} — {{ r.type }}
                        </p>
                        <p class="text-xs text-zinc-500">
                          Capacity {{ r.capacity }}
                          · Floor {{ r.floorNumber }}
                        </p>
                      </div>
                      <span class="text-sm font-bold text-zinc-900">{{ '$' + r.priceOffPeak }}<span class="text-xs font-normal text-zinc-400">/night</span></span>
                    </button>
                  }
                </div>
                @if (noRoomSelected()) {
                  <p class="text-xs text-rose-500 mt-1">Please select a room.</p>
                }
              </div>
            } @else if (datesReady()) {
              <p class="text-sm text-zinc-500">No rooms available for the selected dates.</p>
            }

            <!-- Notes -->
            <mat-form-field>
              <mat-label>Notes (optional)</mat-label>
              <textarea matInput formControlName="notes" rows="2"></textarea>
            </mat-form-field>
          </form>

          <div class="flex justify-between pt-2">
            <button mat-button (click)="goToStep('guest')">Back</button>
            <button mat-flat-button color="primary"
              [disabled]="roomForm.invalid || !selectedRoomId()"
              (click)="goToConfirm()">
              Next: Confirm
            </button>
          </div>
        </div>
      }

      <!-- ── Step 3: Confirm ────────────────────────────────────────────────── -->
      @if (step() === 'confirm') {
        <div class="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm space-y-4">
          <h2 class="text-base font-semibold text-zinc-800">Confirm Walk-In Booking</h2>

          <dl class="divide-y divide-zinc-50 text-sm">
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Guest</dt>
              <dd class="font-medium text-zinc-900">{{ selectedGuest()?.fullName }}</dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Email</dt>
              <dd class="text-zinc-700">{{ selectedGuest()?.email }}</dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Room</dt>
              <dd class="font-medium text-zinc-900">
                @if (selectedRoom()) {
                  Room {{ selectedRoom()!.roomNumber }} — {{ selectedRoom()!.type }}
                }
              </dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Check-in</dt>
              <dd class="text-zinc-700">{{ roomForm.value.checkInDate }}</dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Check-out</dt>
              <dd class="text-zinc-700">{{ roomForm.value.checkOutDate }}</dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Nights</dt>
              <dd class="text-zinc-700">{{ nightCount() }}</dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Guests</dt>
              <dd class="text-zinc-700">{{ roomForm.value.guestCount }}</dd>
            </div>
            <div class="flex justify-between py-2">
              <dt class="text-zinc-500">Est. Total</dt>
              <dd class="text-base font-bold text-zinc-900">{{ '$' + estimatedTotal() }}</dd>
            </div>
          </dl>

          @if (roomForm.value.notes) {
            <p class="text-sm text-zinc-500 italic">"{{ roomForm.value.notes }}"</p>
          }

          <div class="flex justify-between pt-2">
            <button mat-button (click)="goToStep('room')" [disabled]="submitting()">Back</button>
            <button mat-flat-button color="primary"
              [disabled]="submitting()"
              (click)="submit()">
              {{ submitting() ? 'Creating…' : 'Create Booking' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class WalkInBookingComponent {
  private readonly fb          = inject(FormBuilder);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly hotelsApi   = inject(HotelsApiService);
  private readonly roomsApi    = inject(RoomsApiService);
  private readonly usersApi    = inject(UsersApiService);
  private readonly notify      = inject(NotificationService);
  private readonly router      = inject(Router);

  readonly step            = signal<Step>('guest');
  readonly searchLoading   = signal(false);
  readonly searchResults   = signal<GuestListDto[]>([]);
  readonly selectedGuest   = signal<GuestListDto | null>(null);

  readonly hotels          = signal<HotelSummaryDto[]>([]);
  readonly availableRooms  = signal<RoomDto[]>([]);
  readonly roomsLoading    = signal(false);
  readonly selectedRoomId  = signal<number | null>(null);
  readonly noRoomSelected  = signal(false);
  readonly submitting      = signal(false);
  readonly datesReady      = signal(false);

  readonly searchCtrl = this.fb.control('');

  readonly roomForm = this.fb.nonNullable.group({
    hotelId:      [0, Validators.required],
    checkInDate:  ['', Validators.required],
    checkOutDate: ['', Validators.required],
    guestCount:   [1, [Validators.required, Validators.min(1)]],
    notes:        [''],
  });

  private readonly searchSubject = new Subject<string>();

  constructor() {
    // Wire up debounced guest search
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap((term) => {
        if (term.length < 2) { this.searchResults.set([]); return []; }
        this.searchLoading.set(true);
        return this.usersApi.searchGuests(term);
      }),
    ).subscribe({
      next: (results) => { this.searchResults.set(results); this.searchLoading.set(false); },
      error: () => this.searchLoading.set(false),
    });

    this.searchCtrl.valueChanges.subscribe(v => this.searchSubject.next(v ?? ''));

    // Load hotels
    this.hotelsApi.getAll().subscribe({
      next: (h) => {
        this.hotels.set(h);
        if (h.length > 0) this.roomForm.patchValue({ hotelId: h[0].id });
      },
    });
  }

  selectGuest(g: GuestListDto): void {
    this.selectedGuest.set(g);
  }

  goToStep(s: Step): void {
    this.step.set(s);
  }

  onHotelChange(): void {
    this.availableRooms.set([]);
    this.selectedRoomId.set(null);
    this.loadRooms();
  }

  onDateChange(): void {
    this.availableRooms.set([]);
    this.selectedRoomId.set(null);
    this.loadRooms();
  }

  private loadRooms(): void {
    const { hotelId, checkInDate, checkOutDate } = this.roomForm.getRawValue();
    if (!hotelId || !checkInDate || !checkOutDate || checkInDate >= checkOutDate) {
      this.datesReady.set(false);
      return;
    }
    this.datesReady.set(true);
    this.roomsLoading.set(true);
    this.roomsApi.searchAvailable({ hotelId, checkIn: checkInDate, checkOut: checkOutDate })
      .subscribe({
        next: (rooms) => { this.availableRooms.set(rooms); this.roomsLoading.set(false); },
        error: () => this.roomsLoading.set(false),
      });
  }

  goToConfirm(): void {
    this.roomForm.markAllAsTouched();
    if (this.roomForm.invalid) return;
    if (!this.selectedRoomId()) { this.noRoomSelected.set(true); return; }
    this.noRoomSelected.set(false);
    this.step.set('confirm');
  }

  readonly selectedRoom = computed(() =>
    this.availableRooms().find(r => r.id === this.selectedRoomId())
  );

  nightCount(): number {
    const { checkInDate, checkOutDate } = this.roomForm.getRawValue();
    if (!checkInDate || !checkOutDate) return 0;
    const diff = new Date(checkOutDate).getTime() - new Date(checkInDate).getTime();
    return Math.max(0, Math.round(diff / 86_400_000));
  }

  estimatedTotal(): string {
    const room = this.selectedRoom();
    if (!room) return '0.00';
    return (room.priceOffPeak * this.nightCount()).toFixed(2);
  }

  submit(): void {
    const guest = this.selectedGuest();
    const roomId = this.selectedRoomId();
    if (!guest || !roomId) return;

    this.submitting.set(true);
    const { hotelId, checkInDate, checkOutDate, guestCount, notes } = this.roomForm.getRawValue();

    this.bookingsApi.create(guest.id, {
      hotelId,
      checkInDate,
      checkOutDate,
      guestCount,
      notes,
      roomIds: [roomId],
      services: [],
    }).subscribe({
      next: (booking) => {
        this.notify.success(`Booking #${booking.id} created for ${guest.fullName}.`);
        this.router.navigate(['/app/bookings']);
      },
      error: (err) => {
        const msg = err?.error ?? 'Failed to create booking.';
        this.notify.error(typeof msg === 'string' ? msg : 'Failed to create booking.');
        this.submitting.set(false);
      },
    });
  }

  stepClass(s: Step): string {
    const cur = this.step();
    if (s === cur) return 'font-semibold text-sky-700';
    const order: Step[] = ['guest', 'room', 'confirm'];
    return order.indexOf(s) < order.indexOf(cur)
      ? 'text-emerald-600'
      : 'text-zinc-400';
  }
}
