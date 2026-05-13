import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MockAdminDataService, type MockAdminUser } from '../../../core/services/mock-admin-data.service';
import { DialogService } from '../../../core/services/dialog.service';
import { AppConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import type { UserRole } from '../../../core/constants/roles';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppPaginationComponent } from '../../../shared/ui/app-pagination/app-pagination.component';
import { AppBadgeComponent } from '../../../shared/ui/app-badge/app-badge.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    MatTableModule,
    MatDialogModule,
    AppTableComponent,
    AppPaginationComponent,
    AppBadgeComponent,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold text-zinc-900">User management</h1>
        <app-button variant="primary" type="button" (clicked)="addUser()">Add user</app-button>
      </div>
      <app-table>
        <table mat-table [dataSource]="paged()" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let u">{{ u.fullName }}</td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u">
              <app-badge tone="info">{{ u.role }}</app-badge>
            </td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Active</th>
            <td mat-cell *matCellDef="let u">{{ u.active ? 'Yes' : 'No' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let u" class="flex gap-1">
              <button type="button" (click)="toggle(u)" class="rounded px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100">
                {{ u.active ? 'Deactivate' : 'Activate' }}
              </button>
              <button type="button" (click)="remove(u)" class="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                Remove
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols"></tr>
        </table>
      </app-table>
      <app-pagination
        [length]="mock.users().length"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        (pageChange)="onPage($event)"
      />
    </div>
  `,
})
export class UserManagementComponent {
  readonly mock = inject(MockAdminDataService);
  private readonly dialogs = inject(DialogService);

  readonly cols = ['name', 'email', 'role', 'active', 'actions'];
  readonly pageSize = signal(5);
  readonly pageIndex = signal(0);
  readonly paged = signal<MockAdminUser[]>([]);

  constructor() {
    effect(() => {
      this.mock.users();
      this.applyPage();
    });
  }

  private applyPage(): void {
    const all = this.mock.users();
    const start = this.pageIndex() * this.pageSize();
    this.paged.set(all.slice(start, start + this.pageSize()));
  }

  onPage(ev: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(ev.pageIndex);
    this.pageSize.set(ev.pageSize);
    this.applyPage();
  }

  toggle(u: MockAdminUser): void {
    this.mock.upsert({ ...u, active: !u.active });
  }

  remove(u: MockAdminUser): void {
    void this.dialogs
      .open(AppConfirmDialogComponent, {
        data: {
          title: 'Remove user',
          message: `Remove ${u.email} from the directory?`,
          confirmLabel: 'Remove',
        },
      })
      .subscribe((ok) => {
        if (ok) this.mock.remove(u.id);
      });
  }

  addUser(): void {
    const id = Math.max(0, ...this.mock.users().map((x) => x.id)) + 1;
    this.mock.upsert({
      id,
      email: `user${id}@grandplaza.com`,
      fullName: 'New User',
      role: 'Guest' as UserRole,
      active: true,
      lastActivity: new Date().toISOString(),
    });
  }
}
