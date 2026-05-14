// Author: Salaams
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { HotelDto } from '../../../core/models/hotel.models';
import type { RoomDto } from '../../../core/models/room.models';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';

interface RoomPricingRow {
  room: RoomDto;
  offPeak: number;
  peak: number;
  saving: boolean;
}

@Component({
  selector: 'app-hotel-config',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    AppLoaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-6 text-2xl font-semibold text-zinc-900">Hotel Configuration</h1>

    @if (loading()) {
      <app-loader />
    } @else if (hotels().length === 0) {
      <p class="text-sm text-zinc-500">No hotels found.</p>
    } @else {
      <!-- Hotel selector tabs -->
      <div class="mb-6 flex flex-wrap gap-2">
        @for (h of hotels(); track h.id) {
          <button
            class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
            [class.bg-sky-600]="selectedHotelId() === h.id"
            [class.text-white]="selectedHotelId() === h.id"
            [class.bg-zinc-100]="selectedHotelId() !== h.id"
            [class.text-zinc-700]="selectedHotelId() !== h.id"
            (click)="selectHotel(h.id)">
            {{ h.name }}
          </button>
        }
      </div>

      @if (selectedHotel()) {
        <mat-accordion multi>

          <!-- ── Hotel Details ────────────────────────────────────────────── -->
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title class="font-medium">Hotel Details</mat-panel-title>
            </mat-expansion-panel-header>

            <form [formGroup]="hotelForm" class="grid gap-4 py-2 md:grid-cols-2">
              <mat-form-field appearance="outline">
                <mat-label>Hotel name</mat-label>
                <input matInput formControlName="name" />
                @if (hotelForm.get('name')?.invalid && hotelForm.get('name')?.touched) {
                  <mat-error>Required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Country</mat-label>
                <input matInput formControlName="country" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="md:col-span-2">
                <mat-label>Address</mat-label>
                <input matInput formControlName="address" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Contact email</mat-label>
                <input matInput type="email" formControlName="email" />
              </mat-form-field>

              <div class="flex items-center gap-3">
                <mat-slide-toggle formControlName="isActive" color="primary">
                  Hotel active
                </mat-slide-toggle>
              </div>
            </form>

            <div class="flex justify-end pt-2">
              <button mat-flat-button color="primary"
                [disabled]="savingHotel() || hotelForm.invalid"
                (click)="saveHotel()">
                @if (savingHotel()) { Saving… } @else {
                  <mat-icon>save</mat-icon> Save hotel details
                }
              </button>
            </div>
          </mat-expansion-panel>

          <!-- ── Room Pricing ────────────────────────────────────────────── -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title class="font-medium">Room Pricing</mat-panel-title>
              <mat-panel-description>Off-peak & peak rates per room</mat-panel-description>
            </mat-expansion-panel-header>

            @if (loadingRooms()) {
              <app-loader />
            } @else if (pricingRows().length === 0) {
              <p class="py-4 text-sm text-zinc-500">No rooms configured for this hotel.</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-zinc-100 text-left text-xs text-zinc-500">
                      <th class="py-2 pr-4">Room</th>
                      <th class="py-2 pr-4">Type</th>
                      <th class="py-2 pr-4">Off-peak ($/night)</th>
                      <th class="py-2 pr-4">Peak ($/night)</th>
                      <th class="py-2"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-50">
                    @for (row of pricingRows(); track row.room.id; let i = $index) {
                      <tr class="py-2">
                        <td class="py-2 pr-4 font-mono text-zinc-700">{{ row.room.roomNumber }}</td>
                        <td class="py-2 pr-4 text-zinc-500">{{ row.room.type }}</td>
                        <td class="py-2 pr-4">
                          <input type="number" step="0.01" min="0.01"
                            class="w-24 rounded-lg border border-zinc-200 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
                            [value]="row.offPeak"
                            (change)="updateOffPeak(i, $event)" />
                        </td>
                        <td class="py-2 pr-4">
                          <input type="number" step="0.01" min="0.01"
                            class="w-24 rounded-lg border border-zinc-200 px-2 py-1 text-sm focus:border-sky-400 focus:outline-none"
                            [value]="row.peak"
                            (change)="updatePeak(i, $event)" />
                        </td>
                        <td class="py-2">
                          <button mat-flat-button color="primary" class="text-xs"
                            [disabled]="row.saving"
                            (click)="saveRoomPricing(i)">
                            {{ row.saving ? '…' : 'Save' }}
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </mat-expansion-panel>

          <!-- ── Policies (informational) ───────────────────────────────── -->
          <mat-expansion-panel>
            <mat-expansion-panel-header>
              <mat-panel-title class="font-medium">Policies</mat-panel-title>
            </mat-expansion-panel-header>
            <div class="space-y-2 py-2 text-sm text-zinc-600">
              <p><strong>VAT:</strong> 20% applied on checkout. Fixed by system — not configurable here.</p>
              <p><strong>Cancellation:</strong> Free (&gt;14 days) · 50% (3–14 days) · 100% (&lt;72 h).</p>
              <p><strong>Quiet hours:</strong> 22:00–07:00.</p>
              <p><strong>Late checkout:</strong> Subject to availability.</p>
            </div>
          </mat-expansion-panel>

        </mat-accordion>
      }
    }
  `,
})
export class HotelConfigComponent {
  private readonly adminApi  = inject(AdminApiService);
  private readonly hotelsApi = inject(HotelsApiService);
  private readonly notify    = inject(NotificationService);
  private readonly fb        = inject(FormBuilder);

  readonly loading         = signal(true);
  readonly loadingRooms    = signal(false);
  readonly savingHotel     = signal(false);
  readonly hotels          = signal<HotelDto[]>([]);
  readonly selectedHotelId = signal<number | null>(null);
  readonly pricingRows     = signal<RoomPricingRow[]>([]);

  readonly hotelForm = this.fb.nonNullable.group({
    name:     ['', Validators.required],
    city:     [''],
    country:  [''],
    address:  [''],
    phone:    [''],
    email:    [''],
    isActive: [true],
  });

  constructor() {
    // Load all hotels (admin endpoint returns all including inactive)
    this.adminApi.getHotels().subscribe({
      next: (summaries) => {
        // Load full hotel details for each (we need the full HotelDto)
        if (summaries.length === 0) { this.loading.set(false); return; }
        const first = summaries[0];
        this.hotelsApi.getById(first.id).subscribe({
          next: (h) => {
            // We only have full details for one at a time; build a light list
            this.hotels.set(summaries.map(s => ({
              id: s.id, name: s.name, city: s.city, country: s.country,
              address: '', phone: '', email: '', isActive: true,
            })));
            this.loading.set(false);
            this.selectHotel(first.id);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  selectedHotel(): HotelDto | null {
    return this.hotels().find(h => h.id === this.selectedHotelId()) ?? null;
  }

  selectHotel(id: number): void {
    this.selectedHotelId.set(id);
    this.loadingRooms.set(true);
    this.pricingRows.set([]);

    // Load full hotel details
    this.hotelsApi.getById(id).subscribe({
      next: (hotel) => {
        // Update the hotels list with the full details
        this.hotels.update(list => list.map(h => h.id === id ? hotel : h));
        this.hotelForm.patchValue(hotel);
      },
    });

    // Load rooms for pricing
    this.hotelsApi.getRooms(id).subscribe({
      next: (rooms) => {
        this.pricingRows.set(rooms.map(r => ({
          room: r,
          offPeak: r.priceOffPeak,
          peak: r.pricePeak,
          saving: false,
        })));
        this.loadingRooms.set(false);
      },
      error: () => this.loadingRooms.set(false),
    });
  }

  saveHotel(): void {
    this.hotelForm.markAllAsTouched();
    if (this.hotelForm.invalid) return;
    const id = this.selectedHotelId();
    if (!id) return;

    this.savingHotel.set(true);
    this.adminApi.updateHotel(id, this.hotelForm.getRawValue()).subscribe({
      next: (updated) => {
        this.hotels.update(list => list.map(h => h.id === id ? updated : h));
        this.notify.success('Hotel details saved.');
        this.savingHotel.set(false);
      },
      error: () => {
        this.notify.error('Failed to save hotel details.');
        this.savingHotel.set(false);
      },
    });
  }

  updateOffPeak(index: number, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.pricingRows.update(rows => rows.map((r, i) => i === index ? { ...r, offPeak: val } : r));
    }
  }

  updatePeak(index: number, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      this.pricingRows.update(rows => rows.map((r, i) => i === index ? { ...r, peak: val } : r));
    }
  }

  saveRoomPricing(index: number): void {
    const row = this.pricingRows()[index];
    this.pricingRows.update(rows => rows.map((r, i) => i === index ? { ...r, saving: true } : r));
    this.adminApi.updateRoomPricing(row.room.id, { priceOffPeak: row.offPeak, pricePeak: row.peak })
      .subscribe({
        next: () => {
          this.pricingRows.update(rows => rows.map((r, i) => i === index ? { ...r, saving: false } : r));
          this.notify.success(`Room ${row.room.roomNumber} pricing saved.`);
        },
        error: () => {
          this.pricingRows.update(rows => rows.map((r, i) => i === index ? { ...r, saving: false } : r));
          this.notify.error('Failed to save room pricing.');
        },
      });
  }
}
