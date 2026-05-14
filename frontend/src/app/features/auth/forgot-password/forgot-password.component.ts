import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PasswordRecoveryService } from '../../../core/services/password-recovery.service';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { MSG } from '../../../core/i18n/ui-messages';

@Component({
  selector: 'app-forgot-password',
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
          src="https://picsum.photos/seed/grand-plaza-auth/800/1200"
          alt=""
          aria-hidden="true"
          class="h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-br from-zinc-950/75 via-zinc-900/50 to-zinc-800/30"></div>
        <div class="absolute inset-0 flex flex-col justify-end p-12">
          <img src="/logo.png" alt="Grand Plaza" class="mb-6 h-12 w-auto object-contain object-left" />
          <p class="text-lg font-medium text-white/90">We will get you back in.</p>
          <p class="mt-1 text-sm text-white/55">Enter your email and we will send a reset link.</p>
        </div>
      </div>

      <!-- Right: form -->
      <div class="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <div class="w-full max-w-sm">
          <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">{{ msg.forgotTitle }}</h1>
          <p class="mt-1 text-sm text-zinc-500">
            Enter the email address on your account and we will send reset instructions.
          </p>

          <div class="mt-8">
            @if (!done()) {
              <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
                <mat-form-field appearance="outline" class="w-full">
                  <mat-label>Email</mat-label>
                  <input matInput type="email" formControlName="email" autocomplete="email" />
                </mat-form-field>
                <app-button variant="primary" class="w-full" [loading]="loading()" type="submit">
                  Send reset link
                </app-button>
              </form>
            } @else {
              <div class="space-y-3">
                <div class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p class="text-sm text-emerald-800">
                    If an account exists for <strong>{{ emailSent() }}</strong>, a reset token has
                    been generated.
                  </p>
                </div>
                @if (devToken()) {
                  <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <p class="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Dev mode — reset token
                    </p>
                    <code class="block break-all text-xs text-amber-900">{{ devToken() }}</code>
                    <p class="mt-2 text-xs text-amber-700">
                      Copy this token and navigate to
                      <strong>/reset-password?token=&lt;paste here&gt;</strong>
                    </p>
                  </div>
                }
              </div>
            }
          </div>

          <p class="mt-6 text-center text-sm text-zinc-500">
            <a
              routerLink="/login"
              class="font-medium text-zinc-900 underline-offset-4 hover:underline"
              >Back to sign in</a
            >
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly recovery = inject(PasswordRecoveryService);

  readonly msg = MSG.auth;
  readonly loading  = signal(false);
  readonly done     = signal(false);
  readonly emailSent = signal('');
  readonly devToken  = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const email = this.form.controls.email.value;
    this.recovery.requestReset(email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.emailSent.set(email);
        this.devToken.set(res.resetToken ?? '');
        this.done.set(true);
      },
      error: () => this.loading.set(false),
    });
  }
}
