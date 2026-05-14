import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { AppCardComponent } from '../../shared/ui/app-card/app-card.component';
import { AppButtonComponent } from '../../shared/ui/app-button/app-button.component';
import { ContactApiService } from '../../core/services/contact-api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    AppCardComponent,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-2xl px-4 py-12 text-zinc-900">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-semibold tracking-tight">Contact us</h1>
        <p class="mt-2 text-sm text-zinc-500">
          For reservations, partnership enquiries, and group bookings — our concierge team typically responds within 24 hours.
        </p>
      </div>

      <!-- Info strip -->
      <div class="mb-8 grid gap-4 sm:grid-cols-3">
        <div class="flex items-start gap-3 rounded-xl border border-zinc-200 p-4">
          <mat-icon class="mt-0.5 text-amber-500">phone</mat-icon>
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wide">Phone</p>
            <p class="text-sm font-semibold">+44 20 7946 0958</p>
          </div>
        </div>
        <div class="flex items-start gap-3 rounded-xl border border-zinc-200 p-4">
          <mat-icon class="mt-0.5 text-amber-500">email</mat-icon>
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wide">Email</p>
            <p class="text-sm font-semibold">concierge&#64;grandplaza.com</p>
          </div>
        </div>
        <div class="flex items-start gap-3 rounded-xl border border-zinc-200 p-4">
          <mat-icon class="mt-0.5 text-amber-500">schedule</mat-icon>
          <div>
            <p class="text-xs font-medium text-zinc-500 uppercase tracking-wide">Hours</p>
            <p class="text-sm font-semibold">24 / 7</p>
          </div>
        </div>
      </div>

      <!-- Success state -->
      @if (submitted()) {
        @if (sendError()) {
          <div class="flex flex-col items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-8 py-12 text-center">
            <mat-icon class="text-5xl text-amber-500" style="font-size:3rem;width:3rem;height:3rem;">schedule</mat-icon>
            <h2 class="text-xl font-semibold text-amber-800">Message queued</h2>
            <p class="text-sm text-amber-700">Thank you, <strong>{{ submittedName() }}</strong>. Message delivery is pending API integration — please reach us by phone or email for now.</p>
            <button type="button" class="mt-2 text-sm font-medium text-amber-700 underline underline-offset-2" (click)="reset()">
              Send another message
            </button>
          </div>
        } @else {
          <div class="flex flex-col items-center gap-4 rounded-2xl border border-green-200 bg-green-50 px-8 py-12 text-center">
            <mat-icon class="text-5xl text-green-500" style="font-size:3rem;width:3rem;height:3rem;">check_circle</mat-icon>
            <h2 class="text-xl font-semibold text-green-800">Message received!</h2>
            <p class="text-sm text-green-700">Thank you, <strong>{{ submittedName() }}</strong>. Our concierge team will be in touch shortly.</p>
            <button type="button" class="mt-2 text-sm font-medium text-green-700 underline underline-offset-2" (click)="reset()">
              Send another message
            </button>
          </div>
        }
      } @else {
        <!-- Form -->
        <app-card title="Send a message">
          <form class="mt-2 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div class="grid gap-4 sm:grid-cols-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Full name</mat-label>
                <input matInput formControlName="name" autocomplete="name" />
                @if (form.controls.name.invalid && form.controls.name.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Email address</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
                @if (form.controls.email.hasError('required') && form.controls.email.touched) {
                  <mat-error>Email is required</mat-error>
                } @else if (form.controls.email.hasError('email') && form.controls.email.touched) {
                  <mat-error>Enter a valid email address</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Subject</mat-label>
              <mat-select formControlName="subject">
                <mat-option value="reservation">Reservation enquiry</mat-option>
                <mat-option value="group">Group / corporate booking</mat-option>
                <mat-option value="partnership">Partnership</mat-option>
                <mat-option value="feedback">Feedback</mat-option>
                <mat-option value="other">Other</mat-option>
              </mat-select>
              @if (form.controls.subject.invalid && form.controls.subject.touched) {
                <mat-error>Please select a subject</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Message</mat-label>
              <textarea matInput rows="5" formControlName="message" placeholder="Tell us how we can help…"></textarea>
              @if (form.controls.message.invalid && form.controls.message.touched) {
                <mat-error>Message is required</mat-error>
              }
            </mat-form-field>

            <div class="flex justify-end">
              <app-button variant="primary" type="submit" [disabled]="form.invalid || sending()">
                @if (sending()) { Sending… } @else { Send message }
              </app-button>
            </div>
          </form>
        </app-card>
      }
    </div>
  `,
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contactApi = inject(ContactApiService);

  readonly sending = signal(false);
  readonly submitted = signal(false);
  readonly submittedName = signal('');
  readonly sendError = signal(false);

  readonly form = this.fb.nonNullable.group({
    name:    ['', Validators.required],
    email:   ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.sending.set(true);
    const v = this.form.getRawValue();
    this.contactApi.send(v).subscribe({
      next: () => {
        this.submittedName.set(v.name);
        this.sending.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.sending.set(false);
        this.submittedName.set(v.name);
        this.sendError.set(true);
        this.submitted.set(true);
      },
    });
  }

  reset(): void {
    this.submitted.set(false);
    this.sendError.set(false);
    this.form.reset();
  }
}
