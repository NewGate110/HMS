import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { UsersApiService } from '../../../core/services/users-api.service';
import { ReportsApiService } from '../../../core/services/reports-api.service';
import { HotelsApiService } from '../../../core/services/hotels-api.service';
import type { StaffUserDto } from '../../../core/models/user.models';
import type { StaffPerformanceDto } from '../../../core/models/report.models';
import { AppStatCardComponent } from '../../../shared/ui/app-stat-card/app-stat-card.component';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-staff-performance',
  standalone: true,
  imports: [MatTableModule, AppStatCardComponent, AppCardComponent, AppTableComponent, AppLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">Staff performance</h1>
      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card label="Active staff" [value]="activeStaff().toString()" hint="FrontDeskStaff on roster" />
        <app-stat-card label="Total check-ins" [value]="totalCheckIns().toString()" hint="All staff combined" />
        <app-stat-card label="CSAT" value="N/A" hint="Not tracked in this system" />
      </div>
      <app-card title="Team performance">
        @if (loading()) {
          <app-loader caption="Loading performance data…" />
        } @else {
          <app-table>
            <table mat-table [dataSource]="tableData()" class="w-full">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let row">{{ row.fullName }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let row">{{ row.role }}</td>
              </ng-container>
              <ng-container matColumnDef="dept">
                <th mat-header-cell *matHeaderCellDef>Department</th>
                <td mat-cell *matCellDef="let row">{{ row.department }}</td>
              </ng-container>
              <ng-container matColumnDef="created">
                <th mat-header-cell *matHeaderCellDef>Bookings Created</th>
                <td mat-cell *matCellDef="let row">{{ row.bookingsCreated }}</td>
              </ng-container>
              <ng-container matColumnDef="checkins">
                <th mat-header-cell *matHeaderCellDef>Check-ins</th>
                <td mat-cell *matCellDef="let row">{{ row.checkIns }}</td>
              </ng-container>
              <ng-container matColumnDef="checkouts">
                <th mat-header-cell *matHeaderCellDef>Check-outs</th>
                <td mat-cell *matCellDef="let row">{{ row.checkOuts }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let row; columns: cols"></tr>
            </table>
          </app-table>
        }
      </app-card>
    </div>
  `,
})
export class StaffPerformanceComponent {
  private readonly usersApi   = inject(UsersApiService);
  private readonly reportsApi = inject(ReportsApiService);
  private readonly hotelsApi  = inject(HotelsApiService);

  readonly staff      = signal<StaffUserDto[]>([]);
  readonly perfData   = signal<StaffPerformanceDto[]>([]);
  readonly loading    = signal(true);
  readonly cols       = ['name', 'role', 'dept', 'created', 'checkins', 'checkouts'];

  readonly activeStaff   = computed(() => this.staff().filter(s => s.isActive).length);
  readonly totalCheckIns = computed(() => this.perfData().reduce((acc, r) => acc + r.checkIns, 0));

  /** Merge staff roster with performance metrics for the table */
  readonly tableData = computed<StaffPerformanceDto[]>(() => {
    if (this.perfData().length > 0) return this.perfData();
    // Fallback: show staff list with zeroed metrics if performance data not loaded yet
    return this.staff().map(s => ({
      staffId: s.id,
      fullName: `${s.firstName} ${s.lastName}`,
      department: s.department,
      role: s.role,
      bookingsCreated: 0,
      checkIns: 0,
      checkOuts: 0,
    }));
  });

  constructor() {
    // Load staff for roster counts
    this.usersApi.getAllStaff().subscribe({
      next: (s) => this.staff.set(s),
    });

    // Load performance from the first (default) hotel
    this.hotelsApi.getAll().subscribe({
      next: (hotels) => {
        const hotelId = hotels[0]?.id ?? environment.defaultHotelId;
        this.reportsApi.getStaffPerformance(hotelId).subscribe({
          next: (data) => { this.perfData.set(data); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }
}
