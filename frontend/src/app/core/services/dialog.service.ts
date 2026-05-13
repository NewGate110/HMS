import { Injectable, inject, type Type } from '@angular/core';
import { MatDialog, type MatDialogConfig } from '@angular/material/dialog';
import type { Observable } from 'rxjs';

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
}
