import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { CheckInApiService } from '../../../core/services/checkin-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import type { BookingDto } from '../../../core/models/booking.models';
import type { InvoiceDto } from '../../../core/models/invoice.models';

@Component({
  selector: 'app-check-out-flow',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-4 text-2xl font-semibold text-zinc-900">Check-out</h1>
    <mat-stepper linear>
      <mat-step [stepControl]="lookupForm" label="Booking">
        <form [formGroup]="lookupForm" class="space-y-4 py-4">
          <mat-form-field appearance="outline" class="w-full max-w-sm">
            <mat-label>Booking ID</mat-label>
            <input matInput type="number" formControlName="bookingId" />
          </mat-form-field>
          <button mat-flat-button class="!bg-zinc-900 !text-white" type="button" matStepperNext (click)="load()">Load</button>
        </form>
      </mat-step>
      <mat-step label="Invoice & extras">
        @if (booking(); as b) {
          <p class="py-2 text-sm">Guest: {{ b.guestName }} · Balance \${{ b.totalAmount }}</p>
        }
        @if (invoice(); as inv) {
          <mat-list>
            @for (line of inv.lineItems; track line.id) {
              <mat-list-item>
                <span matListItemTitle>{{ line.description }}</span>
                <span matListItemLine>\${{ line.lineTotal }}</span>
              </mat-list-item>
            }
          </mat-list>
          <p class="text-sm font-semibold">Total \${{ inv.totalAmount }}</p>
        } @else {
          <p class="text-sm text-zinc-500">No invoice on file for this booking.</p>
        }
        <form [formGroup]="extrasForm" class="mt-4 space-y-3">
          <mat-form-field appearance="outline" class="w-full max-w-sm">
            <mat-label>Minibar / services ($)</mat-label>
            <input matInput type="number" formControlName="extras" />
          </mat-form-field>
        </form>
        <div class="flex justify-between">
          <button mat-button matStepperPrevious type="button">Back</button>
          <button mat-flat-button class="!bg-zinc-900 !text-white" matStepperNext type="button">Payment</button>
        </div>
      </mat-step>
      <mat-step label="Settle">
        <p class="py-4 text-sm text-zinc-600">
          Card capture UI placeholder — in production this connects to your payment gateway.
        </p>
        <div class="flex justify-between">
          <button mat-button matStepperPrevious type="button">Back</button>
          <button mat-flat-button class="!bg-zinc-900 !text-white" type="button" [disabled]="submitting()" (click)="checkout()">
            Complete check-out
          </button>
        </div>
      </mat-step>
    </mat-stepper>
  `,
})
export class CheckOutFlowComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly checkInApi = inject(CheckInApiService);
  private readonly notify = inject(NotificationService);

  readonly booking = signal<BookingDto | null>(null);
  readonly invoice = signal<InvoiceDto | null>(null);
  readonly submitting = signal(false);

  readonly lookupForm = this.fb.nonNullable.group({
    bookingId: [0, [Validators.required, Validators.min(1)]],
  });

  readonly extrasForm = this.fb.nonNullable.group({
    extras: [0],
  });

  load(): void {
    const id = this.lookupForm.controls.bookingId.value;
    this.bookingsApi.getById(id).subscribe((b) => this.booking.set(b));
    this.bookingsApi.getInvoice(id).subscribe({
      next: (inv) => this.invoice.set(inv),
      error: () => this.invoice.set(null),
    });
  }

  checkout(): void {
    const id = this.lookupForm.controls.bookingId.value;
    this.submitting.set(true);
    this.checkInApi.checkOut(id).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notify.success('Checked out — receipt emailed (mock)');
      },
      error: (err: { error?: { message?: string } }) => {
        this.submitting.set(false);
        this.notify.error(err?.error?.message ?? 'Check-out failed. Please try again.');
      },
    });
  }
}
