import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { UsersApiService } from '../../../core/services/users-api.service';
import type { StaffUserDto } from '../../../core/models/user.models';
import { AppStatCardComponent } from '../../../shared/ui/app-stat-card/app-stat-card.component';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppTableComponent } from '../../../shared/ui/app-table/app-table.component';
import { AppLoaderComponent } from '../../../shared/ui/app-loader/app-loader.component';

@Component({
  selector: 'app-staff-performance',
  standalone: true,
  imports: [MatTableModule, AppStatCardComponent, AppCardComponent, AppTableComponent, AppLoaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">Staff performance</h1>
      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card label="Active shifts" value="12" hint="Mock" />
        <app-stat-card label="Avg handle time" value="4m" />
        <app-stat-card label="CSAT" value="4.8 / 5" />
      </div>
      <app-card title="Team roster">
        @if (loading()) {
          <app-loader caption="Loading staff…" />
        } @else {
          <app-table>
            <table mat-table [dataSource]="staff()" class="w-full">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let s">{{ s.firstName }} {{ s.lastName }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let s">{{ s.role }}</td>
              </ng-container>
              <ng-container matColumnDef="dept">
                <th mat-header-cell *matHeaderCellDef>Department</th>
                <td mat-cell *matCellDef="let s">{{ s.department }}</td>
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
  private readonly usersApi = inject(UsersApiService);

  readonly staff = signal<StaffUserDto[]>([]);
  readonly loading = signal(true);
  readonly cols = ['name', 'role', 'dept'];

  constructor() {
    this.usersApi.getAllStaff().subscribe({
      next: (s) => {
        this.staff.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
