import { SlicePipe } from '@angular/common';
import { FormatTypePipe } from '../../../shared/pipes/format-type.pipe';
import {
  ChangeDetectionStrategy, Component, OnInit,
  inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { RoomsApiService } from '../../../core/services/rooms-api.service';
import { AncillaryServicesApiService } from '../../../core/services/ancillary-services-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { environment } from '../../../../environments/environment';
import type { AddBookingServiceDto, BookingDto, UpdateBookingDto } from '../../../core/models/booking.models';
import type { RoomDto } from '../../../core/models/room.models';
import type { AncillaryServiceDto } from '../../../core/models/service.models';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

// ─────────────────────────────────────────────────────────────────────────────
// Edit-Booking Dialog
// ─────────────────────────────────────────────────────────────────────────────
export interface EditBookingDialogData {
  booking: BookingDto;
}

@Component({
  selector: 'app-edit-booking-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    AppLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="text-lg font-semibold">Edit Booking #{{ data.booking.id }}</h2>

    <mat-dialog-content class="space-y-4 pt-2" style="min-width:420px">
      <form [formGroup]="form" class="flex flex-col gap-4">
        <div class="flex gap-3">
          <mat-form-field class="flex-1">
            <mat-label>Check-in date</mat-label>
            <input matInput type="date" formControlName="checkInDate" />
            @if (form.get('checkInDate')?.invalid && form.get('checkInDate')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
          <mat-form-field class="flex-1">
            <mat-label>Check-out date</mat-label>
            <input matInput type="date" formControlName="checkOutDate" />
            @if (form.get('checkOutDate')?.invalid && form.get('checkOutDate')?.touched) {
              <mat-error>Required</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>Guests</mat-label>
          <input matInput type="number" formControlName="guestCount" min="1" />
        </mat-form-field>

        <div>
          <p class="text-sm font-medium text-zinc-700 mb-2">Select rooms</p>
          @if (loadingRooms()) {
            <app-loader />
          } @else if (availableRooms().length === 0) {
            <p class="text-sm text-zinc-500">No rooms available for the selected dates.</p>
          } @else {
            <div class="space-y-1.5 max-h-48 overflow-y-auto border border-zinc-100 rounded-lg p-2">
              @for (room of availableRooms(); track room.id) {
                <label class="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 hover:bg-zinc-50">
                  <input type="checkbox"
                    class="accent-sky-600"
                    [checked]="selectedRoomIds().has(room.id)"
                    (change)="toggleRoom(room.id)" />
                  <span class="text-sm text-zinc-800">
                    Room {{ room.roomNumber }} · {{ room.type }} · Cap {{ room.capacity }}
                    · <strong>{{ '$' + room.priceOffPeak }}/night</strong>
                  </span>
                </label>
              }
            </div>
          }
          @if (noRoomSelected()) {
            <p class="text-xs text-rose-500 mt-1">Select at least one room.</p>
          }
        </div>

        <mat-form-field>
          <mat-label>Notes (optional)</mat-label>
          <textarea matInput formControlName="notes" rows="2"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="saving()" (click)="save()">
        {{ saving() ? 'Saving…' : 'Save changes' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class EditBookingDialogComponent implements OnInit {
  private readonly fb       = inject(FormBuilder);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly ref      = inject(MatDialogRef<EditBookingDialogComponent>);
  readonly data: EditBookingDialogData = inject(MAT_DIALOG_DATA);

  readonly availableRooms  = signal<RoomDto[]>([]);
  readonly loadingRooms    = signal(false);
  readonly selectedRoomIds = signal<Set<number>>(new Set());
  readonly noRoomSelected  = signal(false);
  readonly saving          = signal(false);

  readonly form = this.fb.nonNullable.group({
    checkInDate:  [this.data.booking.checkInDate.slice(0, 10),  Validators.required],
    checkOutDate: [this.data.booking.checkOutDate.slice(0, 10), Validators.required],
    guestCount:   [this.data.booking.guestCount, [Validators.required, Validators.min(1)]],
    notes:        [this.data.booking.notes ?? ''],
  });

  ngOnInit(): void {
    this.selectedRoomIds.set(new Set(this.data.booking.rooms.map(r => r.id)));
    this.loadRooms();
    this.form.get('checkInDate')!.valueChanges.subscribe(() => this.loadRooms());
    this.form.get('checkOutDate')!.valueChanges.subscribe(() => this.loadRooms());
  }

  loadRooms(): void {
    const ci = this.form.get('checkInDate')!.value;
    const co = this.form.get('checkOutDate')!.value;
    if (!ci || !co || ci >= co) return;
    this.loadingRooms.set(true);
    this.roomsApi.searchAvailable({ hotelId: this.data.booking.hotelId, checkIn: ci, checkOut: co })
      .subscribe({
        next: (rooms) => {
          const booked = this.data.booking.rooms.filter(r => !rooms.find(ar => ar.id === r.id));
          this.availableRooms.set([...rooms, ...(booked as RoomDto[])]);
          this.loadingRooms.set(false);
        },
        error: () => this.loadingRooms.set(false),
      });
  }

  toggleRoom(id: number): void {
    const s = new Set(this.selectedRoomIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedRoomIds.set(s);
    this.noRoomSelected.set(false);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    if (this.selectedRoomIds().size === 0) { this.noRoomSelected.set(true); return; }
    const v = this.form.getRawValue();
    const dto: UpdateBookingDto = {
      checkInDate: v.checkInDate, checkOutDate: v.checkOutDate,
      guestCount: v.guestCount, notes: v.notes,
      roomIds: Array.from(this.selectedRoomIds()),
    };
    this.ref.close(dto);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Add-Service Dialog
// ─────────────────────────────────────────────────────────────────────────────
export interface AddServiceDialogData {
  booking: BookingDto;
  services: AncillaryServiceDto[];
}

@Component({
  selector: 'app-add-service-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title class="text-lg font-semibold">Add Service to Booking #{{ data.booking.id }}</h2>

    <mat-dialog-content style="min-width:380px" class="pt-2">
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Service</mat-label>
          <mat-select formControlName="serviceId">
            @for (svc of data.services; track svc.id) {
              <mat-option [value]="svc.id">
                {{ svc.name }} — {{ '$' + svc.fee }}/{{ svc.unit }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Quantity</mat-label>
          <input matInput type="number" formControlName="quantity" min="1" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Service date</mat-label>
          <input matInput type="date" formControlName="serviceDate"
            [min]="minDate()" [max]="maxDate()" />
          <mat-hint>Must be within booking dates</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="save()">Add Service</button>
    </mat-dialog-actions>
  `,
})
export class AddServiceDialogComponent {
  private readonly fb  = inject(FormBuilder);
  private readonly ref = inject(MatDialogRef<AddServiceDialogComponent>);
  readonly data: AddServiceDialogData = inject(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    serviceId:   [this.data.services[0]?.id ?? 0, Validators.required],
    quantity:    [1, [Validators.required, Validators.min(1)]],
    serviceDate: [this.data.booking.checkInDate.slice(0, 10), Validators.required],
  });

  minDate() { return this.data.booking.checkInDate.slice(0, 10); }
  maxDate() {
    const co = new Date(this.data.booking.checkOutDate);
    co.setDate(co.getDate() - 1);
    return co.toISOString().slice(0, 10);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const dto: AddBookingServiceDto = {
      serviceId: v.serviceId,
      quantity: v.quantity,
      serviceDate: v.serviceDate,
    };
    this.ref.close(dto);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings List
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [
    SlicePipe,
    FormatTypePipe,
    AppLoaderComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
  ],
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
                        {{ b.rooms[0].type | formatType }}
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
                <div class="flex items-center gap-1">
                  <span
                    class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    [class]="statusClass(b.status)"
                  >{{ b.status }}</span>

                  <!-- Edit booking — Pending or Confirmed only -->
                  @if (b.status === 'Pending' || b.status === 'Confirmed') {
                    <button mat-icon-button matTooltip="Edit booking" (click)="openEdit(b)">
                      <mat-icon class="text-sky-600">edit</mat-icon>
                    </button>
                  }

                  <!-- Add service — Confirmed only -->
                  @if (b.status === 'Confirmed') {
                    <button mat-icon-button matTooltip="Add service" (click)="openAddService(b)">
                      <mat-icon class="text-emerald-600">add_circle</mat-icon>
                    </button>
                  }
                </div>
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
                    <span class="inline-flex items-center gap-1 rounded-lg bg-zinc-50 border border-zinc-100 pl-2 pr-1 py-0.5 text-xs text-zinc-600">
                      {{ svc.serviceName }} × {{ svc.quantity }}
                      @if (svc.totalFee) {
                        <span class="text-zinc-400">- &#36;{{ svc.totalFee }}</span>
                      }
                      @if (b.status === 'Confirmed') {
                        <button class="ml-0.5 text-rose-400 hover:text-rose-600 transition-colors"
                          matTooltip="Remove service"
                          (click)="removeService(b, svc.serviceId)">
                          <mat-icon style="font-size:14px;width:14px;height:14px;">close</mat-icon>
                        </button>
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
  private readonly auth         = inject(AuthService);
  private readonly bookingsApi  = inject(BookingsApiService);
  private readonly hotelsApi    = inject(HotelsApiService);
  private readonly servicesApi  = inject(AncillaryServicesApiService);
  private readonly notify       = inject(NotificationService);
  private readonly dialog       = inject(MatDialog);

  readonly rows    = signal<BookingDto[]>([]);
  readonly loading = signal(true);

  private cachedServices: AncillaryServiceDto[] = [];

  constructor() {
    const role = this.auth.role();
    const uid  = this.auth.userId();
    if (role === 'Guest' && uid != null) {
      this.bookingsApi.getByGuest(uid).subscribe({
        next:  (b) => { this.rows.set(b); this.loading.set(false); },
        error: () => { this.loading.set(false); this.notify.error('Failed to load bookings.'); },
      });
      return;
    }
    this.hotelsApi.getAll().pipe(
      switchMap((h) => this.bookingsApi.getByHotel(h[0]?.id ?? environment.defaultHotelId)),
    ).subscribe({
      next:  (b) => { this.rows.set(b); this.loading.set(false); },
      error: () => { this.loading.set(false); this.notify.error('Failed to load bookings.'); },
    });
  }

  openEdit(booking: BookingDto): void {
    const ref = this.dialog.open(EditBookingDialogComponent, {
      data: { booking } satisfies EditBookingDialogData,
      width: '520px',
      disableClose: true,
    });
    ref.afterClosed().subscribe((dto: UpdateBookingDto | undefined) => {
      if (!dto) return;
      this.bookingsApi.update(booking.id, dto).subscribe({
        next: (updated) => {
          this.rows.update(list => list.map(b => b.id === updated.id ? updated : b));
          this.notify.success('Booking updated successfully.');
        },
        error: (err) => {
          const msg = err?.error ?? 'Failed to update booking.';
          this.notify.error(typeof msg === 'string' ? msg : 'Failed to update booking.');
        },
      });
    });
  }

  openAddService(booking: BookingDto): void {
    const open = (services: AncillaryServiceDto[]) => {
      const ref = this.dialog.open(AddServiceDialogComponent, {
        data: { booking, services } satisfies AddServiceDialogData,
        width: '420px',
        disableClose: true,
      });
      ref.afterClosed().subscribe((dto: AddBookingServiceDto | undefined) => {
        if (!dto) return;
        this.bookingsApi.addService(booking.id, dto).subscribe({
          next: (updated) => {
            this.rows.update(list => list.map(b => b.id === updated.id ? updated : b));
            this.notify.success('Service added.');
          },
          error: (err) => {
            const msg = err?.error ?? 'Failed to add service.';
            this.notify.error(typeof msg === 'string' ? msg : 'Failed to add service.');
          },
        });
      });
    };

    if (this.cachedServices.length > 0) { open(this.cachedServices); return; }
    this.servicesApi.getAll().subscribe({
      next: (svcs) => { this.cachedServices = svcs; open(svcs); },
      error: () => this.notify.error('Could not load available services.'),
    });
  }

  removeService(booking: BookingDto, serviceId: number): void {
    this.bookingsApi.removeService(booking.id, serviceId).subscribe({
      next: (updated) => {
        this.rows.update(list => list.map(b => b.id === updated.id ? updated : b));
        this.notify.success('Service removed.');
      },
      error: (err) => {
        const msg = err?.error ?? 'Failed to remove service.';
        this.notify.error(typeof msg === 'string' ? msg : 'Failed to remove service.');
      },
    });
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
