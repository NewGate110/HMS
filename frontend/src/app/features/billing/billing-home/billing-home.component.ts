import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';

interface InvoiceRow {
  id: string;
  guest: string;
  amount: number;
  status: string;
}

@Component({
  selector: 'app-billing-home',
  standalone: true,
  imports: [MatTableModule, AppCardComponent, AppTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-900">Billing</h1>
      <app-card title="Recent invoices (mock)">
        <app-table>
          <table mat-table [dataSource]="rows()" class="w-full">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>Invoice</th>
              <td mat-cell *matCellDef="let r">{{ r.id }}</td>
            </ng-container>
            <ng-container matColumnDef="guest">
              <th mat-header-cell *matHeaderCellDef>Guest</th>
              <td mat-cell *matCellDef="let r">{{ r.guest }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let r">£{{ r.amount }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let r">{{ r.status }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols"></tr>
          </table>
        </app-table>
      </app-card>
    </div>
  `,
})
export class BillingHomeComponent {
  readonly cols = ['id', 'guest', 'amount', 'status'];
  readonly rows = signal<InvoiceRow[]>([
    { id: 'INV-24001', guest: 'Grace Guest', amount: 890, status: 'Paid' },
    { id: 'INV-24002', guest: 'Corporate Retreat', amount: 12400, status: 'Open' },
  ]);
}
