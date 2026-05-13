import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snack = inject(MatSnackBar);

  success(message: string): void {
    this.snack.open(message, 'OK', {
      duration: 4000,
      panelClass: ['gp-snackbar-success'],
    });
  }

  error(message: string): void {
    this.snack.open(message, 'Dismiss', {
      duration: 6000,
      panelClass: ['gp-snackbar-error'],
    });
  }

  info(message: string): void {
    this.snack.open(message, 'OK', { duration: 4000 });
  }
}
