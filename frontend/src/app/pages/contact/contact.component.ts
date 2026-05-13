import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppCardComponent } from '../../shared/ui/app-card/app-card.component';
import { AppButtonComponent } from '../../shared/ui/app-button/app-button.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    AppCardComponent,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-xl px-4 py-12 text-zinc-900">
      <h1 class="text-3xl font-semibold tracking-tight">Contact concierge</h1>
      <p class="mt-2 text-sm text-zinc-600">
        For partnership inquiries and group bookings. This form is front-end only for now.
      </p>
      <app-card title="Send a message" class="mt-6 block">
        <form class="mt-2 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" autocomplete="name" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Message</mat-label>
            <textarea matInput rows="4" formControlName="message"></textarea>
          </mat-form-field>
          <app-button variant="primary" type="submit" [disabled]="form.invalid || sending()">
            @if (sending()) {
              Sending…
            } @else {
              Submit
            }
          </app-button>
        </form>
      </app-card>
    </div>
  `,
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);

  readonly sending = signal(false);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    message: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.sending.set(true);
    setTimeout(() => {
      this.sending.set(false);
      this.notify.success('Thanks — your message has been recorded locally.');
      this.form.reset();
    }, 500);
  }
}
