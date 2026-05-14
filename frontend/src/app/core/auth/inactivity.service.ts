/**
 * InactivityService — auto-logs out the user after 15 minutes of inactivity.
 *
 * Spec requirement: "Auto-logout after 15 min inactivity"
 *
 * Tracks mouse, keyboard, scroll, and touch events on the document.
 * At 13 min: opens a Material dialog with a live 2-minute countdown.
 * At 15 min: closes the dialog and calls auth.logout().
 *
 * "Stay signed in" in the dialog resets all timers.
 * Only active while isAuthenticated() is true.
 * Call start() once from AppComponent.
 */
import { ChangeDetectionStrategy, Component, NgZone, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from './auth.service';

const TIMEOUT_MS        = 15 * 60 * 1000;   // 15 minutes
const WARNING_BEFORE_MS  =  2 * 60 * 1000;  // warn 2 min before (at 13 min)

const ACTIVITY_EVENTS: ReadonlyArray<keyof DocumentEventMap> = [
  'mousemove', 'keydown', 'click', 'scroll', 'touchstart',
];

// ─────────────────────────────────────────────────────────────────────────────
// Warning Dialog Component (inline)
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-inactivity-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 max-w-sm text-center">
      <div class="flex justify-center mb-4">
        <span class="material-icons-outlined text-5xl text-amber-500">timer</span>
      </div>
      <h2 class="text-lg font-semibold text-zinc-900 mb-2">Still there?</h2>
      <p class="text-sm text-zinc-600 mb-1">
        You will be signed out due to inactivity in
      </p>
      <p class="text-3xl font-bold text-amber-600 mb-6 tabular-nums">
        {{ minutesPart() }}:{{ secondsPart() }}
      </p>
      <button mat-flat-button color="primary" class="w-full" mat-dialog-close="stay">
        Stay signed in
      </button>
    </div>
  `,
})
export class InactivityDialogComponent implements OnInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly secondsLeft = signal(WARNING_BEFORE_MS / 1000);
  private ticker: ReturnType<typeof setInterval> | null = null;

  readonly minutesPart = () => {
    const m = Math.floor(this.secondsLeft() / 60);
    return String(m).padStart(2, '0');
  };
  readonly secondsPart = () => {
    const s = this.secondsLeft() % 60;
    return String(s).padStart(2, '0');
  };

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.ticker = setInterval(() => {
        this.zone.run(() => {
          const next = this.secondsLeft() - 1;
          this.secondsLeft.set(next > 0 ? next : 0);
        });
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    if (this.ticker) clearInterval(this.ticker);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// InactivityService
// ─────────────────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class InactivityService implements OnDestroy {
  private readonly auth   = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  private logoutTimer:  ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private dialogRef: MatDialogRef<InactivityDialogComponent> | null = null;
  private readonly boundReset = () => this.reset();

  /** Wire up activity listeners. Call once from AppComponent. */
  start(): void {
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, this.boundReset, { passive: true });
    }
    this.reset();
  }

  private reset(): void {
    if (!this.auth.isAuthenticated()) { this.clearTimers(); return; }

    this.clearTimers();

    // Close any open warning dialog on activity
    this.dialogRef?.close('reset');
    this.dialogRef = null;

    // Warning dialog at 13 min
    this.warningTimer = setTimeout(() => {
      this.dialogRef = this.dialog.open(InactivityDialogComponent, {
        disableClose: true,
        width: '340px',
      });

      this.dialogRef.afterClosed().subscribe((reason: string) => {
        this.dialogRef = null;
        if (reason === 'stay') this.reset();
      });
    }, TIMEOUT_MS - WARNING_BEFORE_MS);

    // Logout at 15 min
    this.logoutTimer = setTimeout(() => {
      this.dialogRef?.close('timeout');
      this.dialogRef = null;
      this.auth.logout();
    }, TIMEOUT_MS);
  }

  private clearTimers(): void {
    if (this.warningTimer !== null) { clearTimeout(this.warningTimer); this.warningTimer = null; }
    if (this.logoutTimer  !== null) { clearTimeout(this.logoutTimer);  this.logoutTimer  = null; }
  }

  ngOnDestroy(): void {
    this.clearTimers();
    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, this.boundReset);
    }
  }
}
