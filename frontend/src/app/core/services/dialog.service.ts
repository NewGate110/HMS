import { Injectable, inject, type Type } from '@angular/core';
import { MatDialog, type MatDialogConfig } from '@angular/material/dialog';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfirmDialogComponent, type ConfirmDialogData } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);

  open<T, D = unknown, R = unknown>(
    component: Type<T>,
    config?: MatDialogConfig<D>,
  ): Observable<R | undefined> {
    return this.dialog
      .open<T, D, R>(component, { autoFocus: 'first-tabbable', ...config })
      .afterClosed();
  }

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this.dialog
      .open<AppConfirmDialogComponent, ConfirmDialogData, boolean>(AppConfirmDialogComponent, {
        autoFocus: 'first-tabbable',
        data,
      })
      .afterClosed()
      .pipe(map((r) => r === true));
  }
}
