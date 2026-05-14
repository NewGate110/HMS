import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

function passwordsMatch(control: AbstractControl): { mismatch: true } | null {
  const p = control.get('newPassword')?.value;
  const c = control.get('confirmPassword')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-[calc(100vh-68px)] items-center justify-center px-6 py-12">
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">Set new password</h1>

        @if (done()) {
          <div class="mt-6 rounded-xl border border-green-200 bg-green-50 px-5 py-6 text-center">
            <p class="text-sm font-medium text-green-800">Password updated successfully.</p>
            <a routerLink="/login" class="mt-3 inline-block text-sm font-medium text-green-700 underline underline-offset-2">Sign in</a>
          </div>
        } @else if (!token()) {
          <p class="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Invalid or missing reset link. Please request a new one from the
            <a routerLink="/forgot-password" class="font-medium underline underline-offset-2">forgot password</a> page.
          </p>
        } @else {
          <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>New password</mat-label>
              <input matInput type="password" formControlName="newPassword" autocomplete="new-password" />
              @if (form.controls.newPassword.hasError('required')) {
                <mat-error>Password is required</mat-error>
              } @else if (form.controls.newPassword.hasError('minlength')) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Confirm password</mat-label>
              <input matInput type="password" formControlName="confirmPassword" autocomplete="new-password" />
              @if (form.hasError('mismatch') && form.controls.confirmPassword.touched) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            @if (error()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{{ error() }}</p>
            }
            <app-button variant="primary" class="w-full" [loading]="loading()" type="submit">
              Reset password
            </app-button>
          </form>
        }
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authApi = inject(AuthApiService);

  readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '');
  readonly loading = signal(false);
  readonly done = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  submit(): void {
    if (this.form.invalid || !this.token()) return;
    this.loading.set(true);
    this.error.set(null);
    this.authApi.resetPassword(this.token(), this.form.controls.newPassword.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.done.set(true);
      },
      error: (err: { error?: unknown }) => {
        this.loading.set(false);
        const body = typeof err.error === 'string' ? err.error : 'Reset failed. The link may have expired.';
        this.error.set(body);
      },
    });
  }
}
