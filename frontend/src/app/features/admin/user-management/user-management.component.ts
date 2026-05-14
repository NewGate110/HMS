import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
  inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminApiService } from '../../../core/services/admin-api.service';
import type { CreateStaffDto, GuestListDto, StaffUserDto, UpdateStaffDto } from '../../../core/models/user.models';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppPaginationComponent } from '../../../shared/ui/app-pagination/app-pagination.component';
import { AppBadgeComponent } from '../../../shared/ui/app-badge/app-badge.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { AppEmptyStateComponent } from '../../../shared/ui/app-empty-state/app-empty-state.component';

// ── Create / Edit Staff Dialog ────────────────────────────────────────────────

export interface StaffDialogData {
  mode: 'create' | 'edit';
  staff?: StaffUserDto;
}

@Component({
  selector: 'app-staff-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Create staff account' : 'Edit staff account' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="grid grid-cols-2 gap-4 pt-2">
        <mat-form-field appearance="outline">
          <mat-label>First name</mat-label>
          <input matInput formControlName="firstName" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Last name</mat-label>
          <input matInput formControlName="lastName" />
        </mat-form-field>
        @if (data.mode === 'create') {
          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="off" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="new-password" />
            <mat-hint>Min 8 chars, upper/lower/number/special</mat-hint>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Employee ID</mat-label>
            <input matInput formControlName="employeeId" />
          </mat-form-field>
        }
        <mat-form-field appearance="outline" [class.col-span-2]="data.mode === 'edit'">
          <mat-label>Department</mat-label>
          <input matInput formControlName="department" />
        </mat-form-field>
        <mat-form-field appearance="outline" [class.col-span-2]="data.mode === 'edit'">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="FrontDeskStaff">Front Desk Staff</mat-option>
            <mat-option value="HotelManager">Hotel Manager</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">
        {{ data.mode === 'create' ? 'Create' : 'Save' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class StaffDialogComponent {
  readonly data = inject<StaffDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<StaffDialogComponent>);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    firstName:  [this.data.staff?.firstName  ?? '', Validators.required],
    lastName:   [this.data.staff?.lastName   ?? '', Validators.required],
    email:      [this.data.staff?.email      ?? '', this.data.mode === 'create' ? [Validators.required, Validators.email] : []],
    password:   ['',                                this.data.mode === 'create' ? Validators.required : []],
    employeeId: [this.data.staff?.employeeId ?? '', this.data.mode === 'create' ? Validators.required : []],
    department: [this.data.staff?.department ?? '', Validators.required],
    role:       [this.data.staff?.role       ?? 'FrontDeskStaff', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (this.data.mode === 'create') {
      this.dialogRef.close({ mode: 'create', ...v } as CreateStaffDto);
    } else {
      this.dialogRef.close({
        mode: 'edit',
        firstName: v.firstName,
        lastName: v.lastName,
        department: v.department,
        role: v.role,
      } as UpdateStaffDto & { mode: 'edit' });
    }
  }
}

// ── User Management Page ──────────────────────────────────────────────────────

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    MatTableModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    AppTableComponent,
    AppPaginationComponent,
    AppBadgeComponent,
    AppLoaderComponent,
    AppEmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-zinc-900">User management</h1>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon> Create staff
        </button>
      </div>

      <mat-tab-group (selectedIndexChange)="onTabChange($event)">

        <!-- ── Staff Tab ────────────────────────────────────────────────── -->
        <mat-tab label="Staff">
          @if (staffLoading()) {
            <div class="pt-6"><app-loader caption="Loading staff…" /></div>
          } @else if (staffError()) {
            <app-empty-state icon="error_outline" title="Could not load staff" [hint]="staffError()!" />
          } @else if (allStaff().length === 0) {
            <app-empty-state icon="badge" title="No staff accounts" hint="Use 'Create staff' to add the first account." />
          } @else {
            <app-table class="mt-4 block">
              <table mat-table [dataSource]="pagedStaff()" class="w-full">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let u">
                    {{ u.firstName }} {{ u.lastName }}
                    @if (!u.isActive) { <span class="ml-1 text-xs text-red-500">(deactivated)</span> }
                  </td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let u" class="text-sm">{{ u.email }}</td>
                </ng-container>
                <ng-container matColumnDef="role">
                  <th mat-header-cell *matHeaderCellDef>Role</th>
                  <td mat-cell *matCellDef="let u">
                    <app-badge tone="info">{{ u.role }}</app-badge>
                  </td>
                </ng-container>
                <ng-container matColumnDef="department">
                  <th mat-header-cell *matHeaderCellDef>Dept</th>
                  <td mat-cell *matCellDef="let u">{{ u.department }}</td>
                </ng-container>
                <ng-container matColumnDef="employeeId">
                  <th mat-header-cell *matHeaderCellDef>Emp ID</th>
                  <td mat-cell *matCellDef="let u" class="font-mono text-sm">{{ u.employeeId }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let u" class="space-x-1 whitespace-nowrap">
                    <button mat-icon-button matTooltip="Edit" (click)="openEditDialog(u)">
                      <mat-icon class="text-lg">edit</mat-icon>
                    </button>
                    @if (u.isLocked) {
                      <button mat-icon-button matTooltip="Unlock account" color="warn" (click)="unlock(u.id)">
                        <mat-icon class="text-lg">lock_open</mat-icon>
                      </button>
                    }
                    <button mat-icon-button
                      [matTooltip]="u.isActive ? 'Deactivate' : 'Reactivate'"
                      [color]="u.isActive ? 'warn' : 'primary'"
                      (click)="toggleActive(u)">
                      <mat-icon class="text-lg">{{ u.isActive ? 'person_off' : 'person_add' }}</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Force password change" (click)="forcePasswordChange(u.id)">
                      <mat-icon class="text-lg">key</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="staffCols"></tr>
                <tr mat-row *matRowDef="let row; columns: staffCols"></tr>
              </table>
            </app-table>
            <app-pagination
              [length]="allStaff().length"
              [pageSize]="staffPageSize()"
              [pageIndex]="staffPageIndex()"
              (pageChange)="onStaffPage($event)"
            />
          }
        </mat-tab>

        <!-- ── Guests Tab ───────────────────────────────────────────────── -->
        <mat-tab label="Guests">
          @if (guestLoading()) {
            <div class="pt-6"><app-loader caption="Loading guests…" /></div>
          } @else if (guestError()) {
            <app-empty-state icon="error_outline" title="Could not load guests" [hint]="guestError()!" />
          } @else if (allGuests().length === 0) {
            <app-empty-state icon="people_outline" title="No guest accounts" hint="Guests appear here after they register." />
          } @else {
            <app-table class="mt-4 block">
              <table mat-table [dataSource]="pagedGuests()" class="w-full">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Name</th>
                  <td mat-cell *matCellDef="let g">
                    {{ g.fullName }}
                    @if (!g.isActive) { <span class="ml-1 text-xs text-red-500">(deactivated)</span> }
                  </td>
                </ng-container>
                <ng-container matColumnDef="email">
                  <th mat-header-cell *matHeaderCellDef>Email</th>
                  <td mat-cell *matCellDef="let g" class="text-sm">{{ g.email }}</td>
                </ng-container>
                <ng-container matColumnDef="phone">
                  <th mat-header-cell *matHeaderCellDef>Phone</th>
                  <td mat-cell *matCellDef="let g" class="text-sm">{{ g.phone || '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="bookings">
                  <th mat-header-cell *matHeaderCellDef>Bookings</th>
                  <td mat-cell *matCellDef="let g">{{ g.totalBookings }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let g" class="space-x-1 whitespace-nowrap">
                    @if (g.isLocked) {
                      <button mat-icon-button matTooltip="Unlock account" color="warn" (click)="unlock(g.id)">
                        <mat-icon class="text-lg">lock_open</mat-icon>
                      </button>
                    }
                    <button mat-icon-button
                      [matTooltip]="g.isActive ? 'Deactivate' : 'Reactivate'"
                      [color]="g.isActive ? 'warn' : 'primary'"
                      (click)="toggleGuestActive(g)">
                      <mat-icon class="text-lg">{{ g.isActive ? 'person_off' : 'person_add' }}</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="guestCols"></tr>
                <tr mat-row *matRowDef="let row; columns: guestCols"></tr>
              </table>
            </app-table>
            <app-pagination
              [length]="allGuests().length"
              [pageSize]="guestPageSize()"
              [pageIndex]="guestPageIndex()"
              (pageChange)="onGuestPage($event)"
            />
          }
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
})
export class UserManagementComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  private readonly dialog   = inject(MatDialog);
  private readonly snack    = inject(MatSnackBar);
  private readonly cdr      = inject(ChangeDetectorRef);

  // ── Staff state ────────────────────────────────────────────────────────────
  readonly staffCols = ['name', 'email', 'role', 'department', 'employeeId', 'actions'];
  readonly staffPageSize  = signal(10);
  readonly staffPageIndex = signal(0);
  readonly allStaff   = signal<StaffUserDto[]>([]);
  readonly pagedStaff = signal<StaffUserDto[]>([]);
  readonly staffLoading = signal(true);
  readonly staffError   = signal<string | null>(null);

  // ── Guest state ────────────────────────────────────────────────────────────
  readonly guestCols = ['name', 'email', 'phone', 'bookings', 'actions'];
  readonly guestPageSize  = signal(10);
  readonly guestPageIndex = signal(0);
  readonly allGuests   = signal<GuestListDto[]>([]);
  readonly pagedGuests = signal<GuestListDto[]>([]);
  readonly guestLoading = signal(false);
  readonly guestError   = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStaff();
  }

  onTabChange(index: number): void {
    if (index === 1 && this.allGuests().length === 0 && !this.guestLoading()) {
      this.loadGuests();
    }
  }

  // ── Loaders ────────────────────────────────────────────────────────────────

  private loadStaff(): void {
    this.staffLoading.set(true);
    this.adminApi.getStaff().subscribe({
      next:  (s) => { this.allStaff.set(s); this.applyStaffPage(); this.staffLoading.set(false); },
      error: (e) => { this.staffError.set((e as Error)?.message ?? 'Failed to load staff'); this.staffLoading.set(false); },
    });
  }

  private loadGuests(): void {
    this.guestLoading.set(true);
    this.adminApi.getGuests().subscribe({
      next:  (g) => { this.allGuests.set(g); this.applyGuestPage(); this.guestLoading.set(false); },
      error: (e) => { this.guestError.set((e as Error)?.message ?? 'Failed to load guests'); this.guestLoading.set(false); },
    });
  }

  // ── Pagination ─────────────────────────────────────────────────────────────

  private applyStaffPage(): void {
    const s = this.staffPageIndex() * this.staffPageSize();
    this.pagedStaff.set(this.allStaff().slice(s, s + this.staffPageSize()));
  }

  private applyGuestPage(): void {
    const s = this.guestPageIndex() * this.guestPageSize();
    this.pagedGuests.set(this.allGuests().slice(s, s + this.guestPageSize()));
  }

  onStaffPage(ev: { pageIndex: number; pageSize: number }): void {
    this.staffPageIndex.set(ev.pageIndex); this.staffPageSize.set(ev.pageSize); this.applyStaffPage();
  }

  onGuestPage(ev: { pageIndex: number; pageSize: number }): void {
    this.guestPageIndex.set(ev.pageIndex); this.guestPageSize.set(ev.pageSize); this.applyGuestPage();
  }

  // ── Staff CRUD ─────────────────────────────────────────────────────────────

  openCreateDialog(): void {
    const ref = this.dialog.open(StaffDialogComponent, { width: '560px', data: { mode: 'create' } as StaffDialogData });
    ref.afterClosed().subscribe((result: (CreateStaffDto & { mode: 'create' }) | undefined) => {
      if (!result) return;
      const { mode: _, ...dto } = result;
      this.adminApi.createStaff(dto as CreateStaffDto).subscribe({
        next: (s) => { this.allStaff.update(arr => [s, ...arr]); this.applyStaffPage(); this.snack.open('Staff account created.', 'OK', { duration: 4000 }); },
        error: () => this.snack.open('Failed to create account.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  openEditDialog(staff: StaffUserDto): void {
    const ref = this.dialog.open(StaffDialogComponent, { width: '560px', data: { mode: 'edit', staff } as StaffDialogData });
    ref.afterClosed().subscribe((result: (UpdateStaffDto & { mode: 'edit' }) | undefined) => {
      if (!result) return;
      const { mode: _, ...dto } = result;
      this.adminApi.updateStaff(staff.id, dto as UpdateStaffDto).subscribe({
        next: (updated) => {
          this.allStaff.update(arr => arr.map(s => s.id === updated.id ? updated : s));
          this.applyStaffPage();
          this.snack.open('Staff account updated.', 'OK', { duration: 4000 });
        },
        error: () => this.snack.open('Failed to update account.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  toggleActive(staff: StaffUserDto): void {
    const action = staff.isActive ? this.adminApi.deactivateUser(staff.id) : this.adminApi.reactivateUser(staff.id);
    action.subscribe({
      next: () => {
        this.allStaff.update(arr => arr.map(s => s.id === staff.id ? { ...s, isActive: !s.isActive } : s));
        this.applyStaffPage();
        this.snack.open(staff.isActive ? 'Account deactivated.' : 'Account reactivated.', 'OK', { duration: 4000 });
      },
      error: () => this.snack.open('Action failed.', 'Dismiss', { duration: 4000 }),
    });
  }

  toggleGuestActive(guest: GuestListDto): void {
    const action = guest.isActive ? this.adminApi.deactivateUser(guest.id) : this.adminApi.reactivateUser(guest.id);
    action.subscribe({
      next: () => {
        this.allGuests.update(arr => arr.map(g => g.id === guest.id ? { ...g, isActive: !g.isActive } : g));
        this.applyGuestPage();
        this.snack.open(guest.isActive ? 'Account deactivated.' : 'Account reactivated.', 'OK', { duration: 4000 });
      },
      error: () => this.snack.open('Action failed.', 'Dismiss', { duration: 4000 }),
    });
  }

  unlock(id: number): void {
    this.adminApi.unlockAccount(id).subscribe({
      next: () => {
        this.allStaff.update(arr => arr.map(s => s.id === id ? { ...s, isLocked: false } : s));
        this.allGuests.update(arr => arr.map(g => g.id === id ? { ...g, isLocked: false } : g));
        this.applyStaffPage(); this.applyGuestPage();
        this.snack.open('Account unlocked.', 'OK', { duration: 4000 });
      },
      error: () => this.snack.open('Failed to unlock.', 'Dismiss', { duration: 4000 }),
    });
  }

  forcePasswordChange(id: number): void {
    this.adminApi.forcePasswordChange(id).subscribe({
      next: () => this.snack.open('User will be prompted to change password on next login.', 'OK', { duration: 5000 }),
      error: () => this.snack.open('Action failed.', 'Dismiss', { duration: 4000 }),
    });
  }
}
