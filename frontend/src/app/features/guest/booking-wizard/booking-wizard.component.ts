import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule, DateFilterFn } from '@angular/material/datepicker';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/auth/auth.service';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { RoomsApiService } from '../../../core/services/rooms-api.service';
import { AncillaryServicesApiService } from '../../../core/services/ancillary-services-api.service';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { environment } from '../../../../environments/environment';
import type { HotelSummaryDto } from '../../../core/models/hotel.models';
import type { RoomDto } from '../../../core/models/room.models';
import type { AncillaryServiceDto } from '../../../core/models/service.models';
import { NotificationService } from '../../../core/services/notification.service';
import { Router } from '@angular/router';
import { toYmd } from '../../../shared/utils/date.utils';

@Component({
  selector: 'app-booking-wizard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-3xl space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-900">Booking wizard</h1>
      <mat-stepper linear #stepper>
        <mat-step [stepControl]="searchForm" label="Stay">
          <form [formGroup]="searchForm" class="grid gap-4 py-4 md:grid-cols-2">
            <mat-form-field appearance="outline">
              <mat-label>Hotel</mat-label>
              <mat-select formControlName="hotelId">
                @for (h of hotels(); track h.id) {
                  <mat-option [value]="h.id">{{ h.name }}</mat-option>
                }
              </mat-select>
              @if (searchForm.controls.hotelId.hasError('required')) {
                <mat-error>Please select a hotel</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Guests</mat-label>
              <input matInput type="number" formControlName="minCapacity" min="1" />
              @if (searchForm.controls.minCapacity.hasError('required')) {
                <mat-error>Guest count is required</mat-error>
              } @else if (searchForm.controls.minCapacity.hasError('min')) {
                <mat-error>At least 1 guest is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Check-in</mat-label>
              <input matInput [matDatepicker]="ci" [matDatepickerFilter]="dateFilter" [min]="minDate" formControlName="checkIn" />
              <mat-datepicker-toggle matIconSuffix [for]="ci" />
              <mat-datepicker #ci />
              @if (searchForm.controls.checkIn.hasError('required')) {
                <mat-error>Check-in date is required</mat-error>
              } @else if (searchForm.controls.checkIn.hasError('matDatepickerMin')) {
                <mat-error>Check-in cannot be in the past</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Check-out</mat-label>
              <input matInput [matDatepicker]="co" [matDatepickerFilter]="dateFilter" [min]="minDate" formControlName="checkOut" />
              <mat-datepicker-toggle matIconSuffix [for]="co" />
              <mat-datepicker #co />
              @if (searchForm.controls.checkOut.hasError('required')) {
                <mat-error>Check-out date is required</mat-error>
              } @else if (searchForm.controls.checkOut.hasError('matDatepickerMin')) {
                <mat-error>Check-out cannot be in the past</mat-error>
              }
            </mat-form-field>
            <div class="md:col-span-2">
              <button mat-flat-button class="!bg-zinc-900 !text-white" type="button" matStepperNext [disabled]="roomsLoading()" (click)="loadRooms()">
                Find rooms
              </button>
            </div>
          </form>
        </mat-step>
        <mat-step label="Room">
          @if (roomsLoading()) {
            <p class="py-6 text-sm text-zinc-500">Loading availability…</p>
          } @else {
            <mat-radio-group class="flex flex-col gap-2 py-4" [formControl]="roomCtrl">
              @for (r of rooms(); track r.id) {
                <mat-radio-button [value]="r">
                  {{ r.roomNumber }} · {{ r.type }} · \${{ r.priceOffPeak }} off-peak
                </mat-radio-button>
              }
            </mat-radio-group>
            <div class="mt-4 flex justify-between">
              <button mat-button matStepperPrevious type="button">Back</button>
              <button mat-flat-button class="!bg-zinc-900 !text-white" matStepperNext type="button" [disabled]="!roomCtrl.value">
                Continue
              </button>
            </div>
          }
        </mat-step>
        <mat-step label="Add-ons">
          <div class="flex flex-col gap-2 py-4">
            @for (s of services(); track s.id) {
              <mat-checkbox (change)="toggleService(s, $event.checked)">{{ s.name }} — \${{ s.fee }}</mat-checkbox>
            }
          </div>
          <div class="flex justify-between">
            <button mat-button matStepperPrevious type="button">Back</button>
            <button mat-flat-button class="!bg-zinc-900 !text-white" matStepperNext type="button">Review</button>
          </div>
        </mat-step>
        <mat-step label="Confirm">
          @if (roomCtrl.value; as pr) {
            <div class="space-y-2 py-4 text-sm text-zinc-700">
              <p><strong>Hotel:</strong> {{ pr.hotelName }}</p>
              <p><strong>Room:</strong> {{ pr.roomNumber }} ({{ pr.type }})</p>
              <p>
                <strong>Dates:</strong> {{ ymd(searchForm.value.checkIn) }} → {{ ymd(searchForm.value.checkOut) }}
              </p>
              <p><strong>Add-ons:</strong> {{ addOnSummary() }}</p>
              <p class="text-xs text-zinc-500">Payment capture is simulated until PSP integration.</p>
            </div>
          }
          <div class="flex justify-between">
            <button mat-button matStepperPrevious type="button">Back</button>
            <button mat-flat-button class="!bg-zinc-900 !text-white" type="button" [disabled]="submitting()" (click)="confirm()">
              Confirm booking
            </button>
          </div>
        </mat-step>
      </mat-stepper>
    </div>
  `,
})
export class BookingWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly hotelsApi = inject(HotelsApiService);
  private readonly roomsApi = inject(RoomsApiService);
  private readonly servicesApi = inject(AncillaryServicesApiService);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly minDate = new Date();

  readonly dateFilter: DateFilterFn<Date | null> = (d: Date | null) => {
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  };

  readonly hotels = signal<HotelSummaryDto[]>([]);
  readonly rooms = signal<RoomDto[]>([]);
  readonly services = signal<AncillaryServiceDto[]>([]);
  readonly roomsLoading = signal(false);
  readonly selectedServices = signal<Map<number, AncillaryServiceDto>>(new Map());
  readonly submitting = signal(false);

  readonly searchForm = this.fb.nonNullable.group({
    hotelId: [environment.defaultHotelId, Validators.required],
    checkIn: [new Date(), Validators.required],
    checkOut: [new Date(Date.now() + 86400000 * 2), Validators.required],
    minCapacity: [2, [Validators.required, Validators.min(1)]],
  });

  readonly roomCtrl = this.fb.control<RoomDto | null>(null, Validators.required);

  constructor() {
    this.hotelsApi.getAll().subscribe((h) => {
      this.hotels.set(h);
      if (h.length) this.searchForm.patchValue({ hotelId: h[0]!.id });
    });
    this.servicesApi.getAll().subscribe((s) => this.services.set(s));
  }

  loadRooms(): void {
    const v = this.searchForm.getRawValue();
    const checkIn = toYmd(v.checkIn);
    const checkOut = toYmd(v.checkOut);
    if (checkOut <= checkIn) return;
    this.roomsLoading.set(true);
    this.roomsApi
      .searchAvailable({
        hotelId: v.hotelId,
        checkIn,
        checkOut,
        minCapacity: v.minCapacity,
      })
      .subscribe({
        next: (r) => {
          this.rooms.set(r);
          this.roomCtrl.setValue(null);
          this.roomsLoading.set(false);
        },
        error: (err: { error?: { message?: string } }) => {
          this.roomsLoading.set(false);
          this.notify.error(err?.error?.message ?? 'Failed to load available rooms.');
        },
      });
  }

  toggleService(s: AncillaryServiceDto, on: boolean): void {
    this.selectedServices.update((m) => {
      const next = new Map(m);
      if (on) next.set(s.id, s);
      else next.delete(s.id);
      return next;
    });
  }

  addOnSummary(): string {
    const vals = [...this.selectedServices().values()];
    if (!vals.length) return 'None';
    return vals.map((x) => x.name).join(', ');
  }

  confirm(): void {
    const guestId = this.auth.userId();
    const room = this.roomCtrl.value;
    if (guestId == null || !room) return;
    const v = this.searchForm.getRawValue();
    const checkIn = toYmd(v.checkIn);
    const checkOut = toYmd(v.checkOut);
    const services = [...this.selectedServices().values()].map((s) => ({
      serviceId: s.id,
      quantity: 1,
      serviceDate: checkIn,
    }));
    this.submitting.set(true);
    this.bookingsApi
      .create(guestId, {
        hotelId: room.hotelId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomIds: [room.id],
        services,
        notes: 'Booked via HMS web',
        guestCount: 1,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.notify.success('Booking confirmed');
          void this.router.navigate(['/app/guest/dashboard']);
        },
        error: (err: { error?: { message?: string } }) => {
          this.submitting.set(false);
          this.notify.error(err?.error?.message ?? 'Booking failed. Please try again.');
        },
      });
  }

  ymd(d: Date | string | null | undefined): string {
    if (!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    return dt.toISOString().slice(0, 10);
  }

}
