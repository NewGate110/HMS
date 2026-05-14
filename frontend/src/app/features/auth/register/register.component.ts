import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../core/auth/auth.service';
import type { UserRole } from '../../../core/constants/roles';
import { isUserRole } from '../../../core/constants/roles';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { MSG } from '../../../core/i18n/ui-messages';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-68px)]">
      <!-- Left: hero image -->
      <div class="relative hidden flex-1 lg:block">
        <img
          src="https://images.unsplash.com/photo-1574223706388-0e0f6f0390b2?h=1200&w=800&auto=format&fit=crop"
          alt=""
          aria-hidden="true"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-br from-zinc-950/75 via-zinc-900/50 to-zinc-800/30"
        ></div>
        <div class="absolute inset-0 flex flex-col justify-end p-12">
          <img
            src="/logo.png"
            alt="Grand Plaza"
            class="mb-6 h-12 w-auto object-contain object-left"
          />
          <p class="text-lg font-medium text-white/90">Begin your Grand Plaza journey.</p>
          <p class="mt-1 text-sm text-white/55">
            Create an account to manage your stays and rewards.
          </p>
        </div>
      </div>

      <!-- Right: form -->
      <div class="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <div class="w-full max-w-md">
          <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">
            {{ msg.registerTitle }}
          </h1>

          <form class="mt-8 grid gap-4 md:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.hasError('required')) {
                <mat-error>Email is required</mat-error>
              } @else if (form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Password</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                autocomplete="new-password"
              />
              @if (form.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              } @else if (form.controls.password.hasError('minlength')) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>First name</mat-label>
              <input matInput formControlName="firstName" autocomplete="given-name" />
              @if (form.controls.firstName.hasError('required')) {
                <mat-error>First name is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Last name</mat-label>
              <input matInput formControlName="lastName" autocomplete="family-name" />
              @if (form.controls.lastName.hasError('required')) {
                <mat-error>Last name is required</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" autocomplete="tel" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Address</mat-label>
              <textarea matInput rows="2" formControlName="address"></textarea>
            </mat-form-field>
            @if (error()) {
              <p
                class="col-span-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                role="alert"
              >
                {{ error() }}
              </p>
            }
            <div class="md:col-span-2">
              <app-button variant="primary" class="w-full" [loading]="loading()" type="submit">
                Create account
              </app-button>
            </div>
          </form>

          <p class="mt-6 text-center text-sm text-zinc-500">
            Already registered?
            <a
              routerLink="/login"
              class="font-medium text-zinc-900 underline-offset-4 hover:underline"
              >Sign in</a
            >
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly msg = MSG.auth;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    phone: [''],
    address: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    const v = this.form.getRawValue();
    this.auth
      .register({
        email: v.email,
        password: v.password,
        firstName: v.firstName,
        lastName: v.lastName,
        phone: v.phone || undefined,
        address: v.address || undefined,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (!isUserRole(res.role)) return;
          void this.router.navigateByUrl('/app/guest/dashboard');
        },
        error: (err: { error?: unknown }) => {
          this.loading.set(false);
          const body = typeof err.error === 'string' ? err.error : 'Registration failed.';
          this.error.set(body);
        },
      });
  }
}
