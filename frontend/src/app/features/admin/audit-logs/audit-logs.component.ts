import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

interface AuditRow {
  id: number;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    AppTableComponent,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-900">Audit logs</h1>
      <mat-form-field appearance="outline" class="w-full max-w-md">
        <mat-label>Search</mat-label>
        <input matInput [formControl]="query" placeholder="Actor, action, detail…" />
      </mat-form-field>
      <app-table>
        <table mat-table [dataSource]="filtered()" class="w-full">
          <ng-container matColumnDef="at">
            <th mat-header-cell *matHeaderCellDef>When</th>
            <td mat-cell *matCellDef="let r">{{ r.at }}</td>
          </ng-container>
          <ng-container matColumnDef="actor">
            <th mat-header-cell *matHeaderCellDef>Actor</th>
            <td mat-cell *matCellDef="let r">{{ r.actor }}</td>
          </ng-container>
          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Action</th>
            <td mat-cell *matCellDef="let r">{{ r.action }}</td>
          </ng-container>
          <ng-container matColumnDef="detail">
            <th mat-header-cell *matHeaderCellDef>Detail</th>
            <td mat-cell *matCellDef="let r">{{ r.detail }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </app-table>
      <div class="flex gap-2">
        <app-button variant="secondary" type="button" (clicked)="exportCsv()">Export CSV</app-button>
        <app-button variant="secondary" type="button" (clicked)="exportJson()">Export JSON</app-button>
      </div>
    </div>
  `,
})
export class AuditLogsComponent {
  readonly cols = ['at', 'actor', 'action', 'detail'];

  readonly rows = signal<AuditRow[]>([
    {
      id: 1,
      at: new Date().toISOString(),
      actor: 'admin@grandplaza.com',
      action: 'login.success',
      detail: 'IP 127.0.0.1',
    },
    {
      id: 2,
      at: new Date(Date.now() - 3600000).toISOString(),
      actor: 'staff@grandplaza.com',
      action: 'booking.checkin',
      detail: 'Booking #101',
    },
    {
      id: 3,
      at: new Date(Date.now() - 7200000).toISOString(),
      actor: 'system',
      action: 'report.generated',
      detail: 'Occupancy weekly',
    },
  ]);

  readonly query = new FormControl('', { nonNullable: true });
  private readonly querySig = toSignal(this.query.valueChanges.pipe(startWith('')), {
    initialValue: '',
  });

  readonly filtered = computed(() => {
    const q = this.querySig().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(
      (r) =>
        r.actor.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q),
    );
  });

  exportCsv(): void {
    const lines = ['at,actor,action,detail', ...this.filtered().map((r) => `${r.at},${r.actor},${r.action},${r.detail}`)];
    this.download('audit.csv', lines.join('\n'), 'text/csv');
  }

  exportJson(): void {
    this.download('audit.json', JSON.stringify(this.filtered(), null, 2), 'application/json');
  }

  private download(name: string, body: string, type: string): void {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
