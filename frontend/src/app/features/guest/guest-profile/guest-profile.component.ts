import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/auth/auth.service';
import { UsersApiService } from '../../../core/services/users-api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

@Component({
  selector: 'app-guest-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AppCardComponent,
    AppLoaderComponent,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">Profile</h1>
      @if (loading()) {
        <app-loader />
      } @else {
        <app-card title="Personal details">
          <form class="mt-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>First name</mat-label>
              <input matInput formControlName="firstName" />
              @if (form.controls.firstName.hasError('required')) {
                <mat-error>First name is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Last name</mat-label>
              <input matInput formControlName="lastName" />
              @if (form.controls.lastName.hasError('required')) {
                <mat-error>Last name is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Address</mat-label>
              <textarea matInput rows="3" formControlName="address"></textarea>
            </mat-form-field>
            <app-button variant="primary" type="submit" [disabled]="saving() || form.invalid" [loading]="saving()">
              Save changes
            </app-button>
          </form>
        </app-card>
        <app-card title="Saved preferences (mock)">
          <p class="text-sm text-zinc-600">
            Late check-out, high floor, hypoallergenic pillows — wire to API when guest preferences exist.
          </p>
        </app-card>

        <!-- Payment Methods placeholder -->
        <app-card title="Payment Methods">
          <div class="mt-2 flex flex-col items-start gap-3">
            <div class="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 w-full">
              <span class="material-icons-outlined text-zinc-400">credit_card_off</span>
              <span>No saved cards — payment is processed at checkout.</span>
            </div>
            <button
              disabled
              class="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed opacity-60">
              <span class="material-icons-outlined text-[16px]">add</span>
              Add Card
              <span class="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">Coming soon</span>
            </button>
            <p class="text-xs text-zinc-400">
              Card storage is part of our payment simulation. All charges are processed securely at check-out.
            </p>
          </div>
        </app-card>
      }
    </div>
  `,
})
export class GuestProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly usersApi = inject(UsersApiService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    address: [''],
  });

  constructor() {
    const id = this.auth.userId();
    if (id == null) {
      this.loading.set(false);
      return;
    }
    this.usersApi.getGuest(id).subscribe({
      next: (g) => {
        this.form.patchValue({
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone,
          address: g.address,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    const id = this.auth.userId();
    if (id == null || this.form.invalid) return;
    this.saving.set(true);
    this.usersApi.updateGuest(id, this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.notify.success('Profile updated');
      },
      error: () => { this.saving.set(false); this.notify.error('Failed to update profile.'); },
    });
  }
}
