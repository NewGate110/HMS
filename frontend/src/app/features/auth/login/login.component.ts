import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/auth/auth.service';
import type { UserRole } from '../../../core/constants/roles';
import { isUserRole } from '../../../core/constants/roles';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { MSG } from '../../../core/i18n/ui-messages';
import { environment } from '../../../../environments/environment';

interface DemoUser { role: string; name: string; email: string; password: string; }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NgClass,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
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
          <p class="text-lg font-medium text-white/90">Your home away from home.</p>
          <p class="mt-1 text-sm text-white/55">Luxury hospitality in the heart of the Maldives.</p>
        </div>
      </div>

      <!-- Right: form -->
      <div class="flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
        <div class="w-full max-w-sm">
          <h1 class="text-2xl font-semibold tracking-tight text-zinc-900">{{ msg.loginTitle }}</h1>
          <p class="mt-1 text-sm text-zinc-500">Use your Grand Plaza credentials</p>

          <form class="mt-8 space-y-5" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="username" />
              @if (form.controls.email.hasError('required')) {
                <mat-error>Email is required</mat-error>
              } @else if (form.controls.email.hasError('email')) {
                <mat-error>Enter a valid email address</mat-error>
              }
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
              @if (form.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>
            <mat-checkbox formControlName="remember">Stay signed in</mat-checkbox>
            @if (error()) {
              <p class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
                {{ error() }}
              </p>
            }
            <app-button variant="primary" class="w-full" [loading]="loading()" type="submit">
              Sign in
            </app-button>
          </form>

          <p class="mt-6 text-center text-sm text-zinc-500">
            <a
              routerLink="/forgot-password"
              class="font-medium text-zinc-900 underline-offset-4 hover:underline"
              >Forgot password?</a
            >
            <span class="mx-2 text-zinc-300">·</span>
            <a
              routerLink="/register"
              class="font-medium text-zinc-900 underline-offset-4 hover:underline"
              >Create account</a
            >
          </p>
        </div>
      </div>
    </div>

    <!-- Demo user selector — non-production only, credentials not present in prod bundle -->
    @if (isDemo) {
      <div class="fixed bottom-6 right-6 z-50">
        @if (demoOpen()) {
          <!-- Click-away backdrop -->
          <div
            class="fixed inset-0"
            (click)="demoOpen.set(false)"
            aria-hidden="true"
          ></div>

          <!-- Panel -->
          <div
            class="absolute bottom-full right-0 mb-3 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Select a demo account"
          >
            <div class="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <span class="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                Demo accounts
              </span>
              <button
                type="button"
                (click)="demoOpen.set(false)"
                class="rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close demo panel"
              >
                <span class="material-icons-outlined text-[18px]" aria-hidden="true">close</span>
              </button>
            </div>

            <div class="py-1" role="list">
              @for (u of demoUsers; track u.email) {
                <button
                  type="button"
                  (click)="fillDemo(u)"
                  class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
                  role="listitem"
                  [attr.aria-label]="'Sign in as ' + u.name + ' (' + u.role + ')'"
                >
                  <span
                    class="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    [ngClass]="roleBadgeClass(u.role)"
                  >{{ u.role }}</span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-zinc-800">{{ u.name }}</p>
                    <p class="truncate text-[11px] text-zinc-400">{{ u.email }}</p>
                  </div>
                </button>
              }
            </div>
          </div>
        }

        <!-- Trigger button -->
        <button
          type="button"
          (click)="demoOpen.update(v => !v)"
          [attr.aria-expanded]="demoOpen()"
          aria-haspopup="dialog"
          class="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-500 shadow-md transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
        >
          <span class="material-icons-outlined text-[16px] text-zinc-400" aria-hidden="true">science</span>
          Demo users
        </button>
      </div>
    }
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly msg = MSG.auth;
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly demoOpen = signal(false);

  // Credentials come from environment.ts only — absent in environment.prod.ts
  readonly isDemo = !environment.production;
  readonly demoUsers: DemoUser[] = environment.demoUsers;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false],
  });

  @HostListener('document:keydown.escape')
  closeDemoPanel(): void {
    this.demoOpen.set(false);
  }

  fillDemo(user: DemoUser): void {
    this.form.patchValue({ email: user.email, password: user.password });
    this.error.set(null);
    this.demoOpen.set(false);
  }

  roleBadgeClass(role: string): string {
    const map: Record<string, string> = {
      Admin:   'bg-rose-100 text-rose-700',
      Manager: 'bg-amber-100 text-amber-700',
      Staff:   'bg-sky-100 text-sky-700',
      Guest:   'bg-emerald-100 text-emerald-700',
    };
    return map[role] ?? 'bg-zinc-100 text-zinc-700';
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (!isUserRole(res.role)) return;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl && returnUrl.startsWith('/')) {
          void this.router.navigateByUrl(returnUrl);
        } else {
          this.auth.navigateAfterLogin(res.role as UserRole);
        }
      },
      error: (err: { status?: number; error?: unknown }) => {
        this.loading.set(false);
        const body =
          typeof err.error === 'string'
            ? err.error
            : 'Unable to sign in. Check your email and password.';
        this.error.set(body);
      },
    });
  }
}
