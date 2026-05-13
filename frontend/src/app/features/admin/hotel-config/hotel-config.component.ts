import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from '../../../core/services/notification.service';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

@Component({
  selector: 'app-hotel-config',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-4 text-2xl font-semibold text-zinc-900">Hotel configuration</h1>
    <mat-accordion multi>
      <mat-expansion-panel [expanded]="true">
        <mat-expansion-panel-header>Room types</mat-expansion-panel-header>
        <form [formGroup]="roomTypes" class="grid gap-3 py-2 md:grid-cols-2">
          <mat-form-field appearance="outline">
            <mat-label>Deluxe base rate (£)</mat-label>
            <input matInput type="number" formControlName="deluxe" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Suite base rate (£)</mat-label>
            <input matInput type="number" formControlName="suite" />
          </mat-form-field>
        </form>
      </mat-expansion-panel>
      <mat-expansion-panel>
        <mat-expansion-panel-header>Taxes & fees</mat-expansion-panel-header>
        <p class="text-sm text-zinc-600">
          VAT and city tax rules — mock until configuration API ships.
        </p>
      </mat-expansion-panel>
      <mat-expansion-panel>
        <mat-expansion-panel-header>Policies</mat-expansion-panel-header>
        <textarea class="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm" rows="4">
Late checkout subject to availability. Quiet hours 22:00–07:00.</textarea
        >
      </mat-expansion-panel>
    </mat-accordion>
    <div class="mt-4">
      <app-button variant="primary" type="button" (clicked)="save()">Save draft</app-button>
    </div>
  `,
})
export class HotelConfigComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);

  readonly roomTypes = this.fb.nonNullable.group({
    deluxe: [220],
    suite: [420],
  });

  save(): void {
    this.notify.success('Configuration saved locally (mock).');
  }
}
