import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs/operators';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppEmptyStateComponent } from '../../../shared/ui/app-empty-state/app-empty-state.component';
import { AdminApiService, type AuditLogDto } from '../../../core/services/admin-api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    AppTableComponent,
    AppButtonComponent,
    AppLoaderComponent,
    AppEmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold text-zinc-900">Audit logs</h1>

      @if (loading()) {
        <app-loader caption="Loading audit logs…" />
      } @else if (error()) {
        <app-empty-state icon="error_outline" title="Could not load audit logs" [hint]="error()!" />
      } @else {
        <mat-form-field appearance="outline" class="w-full max-w-md">
          <mat-label>Search</mat-label>
          <input matInput [formControl]="query" placeholder="Actor, action, detail…" />
        </mat-form-field>

        @if (filtered().length === 0) {
          <app-empty-state icon="manage_search" title="No matching log entries" hint="Try a different search term." />
        } @else {
          <app-table>
            <table mat-table [dataSource]="filtered()" class="w-full">
              <ng-container matColumnDef="at">
                <th mat-header-cell *matHeaderCellDef>When</th>
                <td mat-cell *matCellDef="let r" class="text-sm text-zinc-600">
                  {{ r.timestamp | date:'dd MMM yyyy, HH:mm' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="actor">
                <th mat-header-cell *matHeaderCellDef>Actor</th>
                <td mat-cell *matCellDef="let r">{{ r.actorEmail ?? '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="action">
                <th mat-header-cell *matHeaderCellDef>Action</th>
                <td mat-cell *matCellDef="let r" class="font-mono text-sm">{{ r.action }}</td>
              </ng-container>
              <ng-container matColumnDef="entity">
                <th mat-header-cell *matHeaderCellDef>Entity</th>
                <td mat-cell *matCellDef="let r" class="text-sm text-zinc-500">{{ r.entityType }}{{ r.entityId ? ' #' + r.entityId : '' }}</td>
              </ng-container>
              <ng-container matColumnDef="detail">
                <th mat-header-cell *matHeaderCellDef>Detail</th>
                <td mat-cell *matCellDef="let r">{{ r.details }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
          </app-table>
        }

        <div class="flex gap-2">
          <app-button variant="secondary" type="button" (clicked)="exportCsv()">Export CSV</app-button>
          <app-button variant="secondary" type="button" (clicked)="exportJson()">Export JSON</app-button>
        </div>
      }
    </div>
  `,
})
export class AuditLogsComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly notify = inject(NotificationService);

  readonly cols = ['at', 'actor', 'action', 'entity', 'detail'];
  readonly rows = signal<AuditLogDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly query = new FormControl('', { nonNullable: true });
  private readonly querySig = toSignal(this.query.valueChanges.pipe(startWith('')), { initialValue: '' });

  readonly filtered = computed(() => {
    const q = this.querySig().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(
      (r) =>
        (r.actorEmail ?? '').toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q) ||
        r.entityType.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.adminApi.getAuditLogs().subscribe({
      next: (logs) => { this.rows.set(logs); this.loading.set(false); },
      error: (err) => { this.error.set((err as Error)?.message ?? 'Failed to load logs'); this.loading.set(false); },
    });
  }

  exportCsv(): void {
    if (!this.filtered().length) { this.notify.error('No records to export.'); return; }
    const lines = [
      'timestamp,actor,action,entityType,entityId,details',
      ...this.filtered().map((r) => `${r.timestamp},${r.actorEmail ?? ''},${r.action},${r.entityType},${r.entityId},${r.details}`),
    ];
    this.download('audit.csv', lines.join('\n'), 'text/csv');
  }

  exportJson(): void {
    if (!this.filtered().length) { this.notify.error('No records to export.'); return; }
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
