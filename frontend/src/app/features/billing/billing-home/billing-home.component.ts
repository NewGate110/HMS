import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppEmptyStateComponent } from '../../../shared/ui/app-empty-state/app-empty-state.component';
import { BookingsApiService } from '../../../core/services/bookings-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';
import type { InvoiceDto } from '../../../core/models/invoice.models';
import type { BookingDto } from '../../../core/models/booking.models';

interface InvoiceRow {
  invoiceNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  total: number;
  isPaid: boolean;
}

@Component({
  selector: 'app-billing-home',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatTableModule, AppCardComponent, AppTableComponent, AppLoaderComponent, AppEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-900">Billing &amp; Invoices</h1>

      @if (loading()) {
        <app-loader caption="Loading invoices…" />
      } @else if (error()) {
        <app-empty-state icon="error_outline" title="Could not load invoices" [hint]="error()!" />
      } @else if (rows().length === 0) {
        <app-empty-state icon="receipt_long" title="No invoices yet" hint="Invoices are generated at check-out." />
      } @else {
        <app-card title="Invoices">
          <app-table>
            <table mat-table [dataSource]="rows()" class="w-full">
              <ng-container matColumnDef="invoiceNumber">
                <th mat-header-cell *matHeaderCellDef>Invoice #</th>
                <td mat-cell *matCellDef="let r" class="font-mono text-sm">{{ r.invoiceNumber }}</td>
              </ng-container>
              <ng-container matColumnDef="guestName">
                <th mat-header-cell *matHeaderCellDef>Guest</th>
                <td mat-cell *matCellDef="let r">{{ r.guestName }}</td>
              </ng-container>
              <ng-container matColumnDef="checkIn">
                <th mat-header-cell *matHeaderCellDef>Check-in</th>
                <td mat-cell *matCellDef="let r">{{ r.checkIn | date:'dd MMM yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="checkOut">
                <th mat-header-cell *matHeaderCellDef>Check-out</th>
                <td mat-cell *matCellDef="let r">{{ r.checkOut | date:'dd MMM yyyy' }}</td>
              </ng-container>
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let r" class="font-semibold">\${{ r.total | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let r">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    [class]="r.isPaid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'"
                  >
                    {{ r.isPaid ? 'Paid' : 'Outstanding' }}
                  </span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
          </app-table>
        </app-card>
      }
    </div>
  `,
})
export class BillingHomeComponent implements OnInit {
  private readonly bookingsApi = inject(BookingsApiService);
  private readonly auth = inject(AuthService);

  readonly cols = ['invoiceNumber', 'guestName', 'checkIn', 'checkOut', 'total', 'status'];
  readonly rows = signal<InvoiceRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const userId = this.auth.userId();
    const role = this.auth.role();
    if (!userId) { this.loading.set(false); return; }

    // Guests see their own invoices; all other roles see the hotel's invoices (hotel 1)
    const bookings$ = role === 'Guest'
      ? this.bookingsApi.getByGuest(userId)
      : this.bookingsApi.getByHotel(environment.defaultHotelId);

    bookings$.pipe(
      switchMap((bookings: BookingDto[]) => {
        const checkedOut = bookings.filter((b) => b.status === 'CheckedOut');
        if (checkedOut.length === 0) return of([] as Array<{ booking: BookingDto; invoice: InvoiceDto | null }>);
        return forkJoin(
          checkedOut.map((b) =>
            this.bookingsApi.getInvoice(b.id).pipe(
              catchError(() => of(null)),
              switchMap((inv) => of({ booking: b, invoice: inv as InvoiceDto | null })),
            ),
          ),
        );
      }),
      catchError((err) => {
        this.error.set((err as Error)?.message ?? 'Unexpected error');
        this.loading.set(false);
        return of([] as Array<{ booking: BookingDto; invoice: InvoiceDto | null }>);
      }),
    ).subscribe((pairs) => {
      this.rows.set(
        pairs
          .filter((p) => p.invoice !== null)
          .map((p) => ({
            invoiceNumber: p.invoice!.invoiceNumber,
            guestName: p.booking.guestName,
            checkIn: p.booking.checkInDate,
            checkOut: p.booking.checkOutDate,
            total: p.invoice!.totalAmount,
            isPaid: p.booking.status === 'CheckedOut',
          })),
      );
      this.loading.set(false);
    });
  }
}
