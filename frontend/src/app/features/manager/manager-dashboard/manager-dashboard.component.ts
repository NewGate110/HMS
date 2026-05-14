import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ReportsApiService } from '../../../core/services/reports-api.service';
import { environment } from '../../../../environments/environment';
import type { OccupancyReportDto, RevenueReportDto } from '../../../core/models/report.models';
import { AppStatCardComponent } from '../../../shared/ui/app-stat-card/app-stat-card.component';
import { AppChartCardComponent } from '../../../shared/ui/app-chart-card/app-chart-card.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';
import { toYmd } from '../../../shared/utils/date.utils';
import type { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    AppStatCardComponent,
    AppChartCardComponent,
    AppButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">Management dashboard</h1>
      <form [formGroup]="range" class="flex flex-wrap items-end gap-3">
        <mat-form-field appearance="outline">
          <mat-label>From</mat-label>
          <input matInput [matDatepicker]="f" formControlName="from" />
          <mat-datepicker-toggle matIconSuffix [for]="f" />
          <mat-datepicker #f />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>To</mat-label>
          <input matInput [matDatepicker]="t" formControlName="to" />
          <mat-datepicker-toggle matIconSuffix [for]="t" />
          <mat-datepicker #t />
        </mat-form-field>
        <app-button variant="primary" type="button" (clicked)="load()">Apply range</app-button>
      </form>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <app-stat-card label="Occupancy" [value]="occPct()" hint="Selected window" />
        <app-stat-card label="ADR (mock)" [value]="'$' + adr()" hint="Derived sample" />
        <app-stat-card label="RevPAR (mock)" [value]="'$' + revpar()" />
        <app-stat-card label="Cancellations" value="—" hint="API pending" />
      </div>
      @defer (on idle) {
        <div class="grid gap-4 lg:grid-cols-2">
          <app-chart-card title="Revenue trend (sample)" [type]="'bar'" [data]="revChartData()" />
          <app-chart-card title="Occupancy trend (sample)" [type]="'line'" [data]="occChartData()" />
        </div>
      } @placeholder {
        <p class="text-sm text-zinc-500">Preparing charts…</p>
      }
    </div>
  `,
})
export class ManagerDashboardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly reportsApi = inject(ReportsApiService);

  readonly occ = signal<OccupancyReportDto | null>(null);
  readonly rev = signal<RevenueReportDto | null>(null);

  readonly range = this.fb.nonNullable.group({
    from: [new Date(Date.now() - 86400000 * 30)],
    to: [new Date()],
  });

  readonly occPct = signal('—');
  readonly adr = signal('0');
  readonly revpar = signal('0');

  readonly revChartData = signal<ChartConfiguration['data']>({
    labels: [],
    datasets: [{ label: 'Revenue $', data: [] }],
  });

  readonly occChartData = signal<ChartConfiguration['data']>({
    labels: [],
    datasets: [{ label: 'Occupancy %', data: [], tension: 0.3 }],
  });

  constructor() {
    this.load();
  }

  load(): void {
    const v = this.range.getRawValue();
    const from = toYmd(v.from);
    const to = toYmd(v.to);
    const hid = environment.defaultHotelId;
    this.reportsApi.getOccupancy(hid, from, to).subscribe((o) => {
      this.occ.set(o);
      this.occPct.set(`${o.occupancyRate.toFixed(1)}%`);
      this.occChartData.set({
        labels: [`${from} → ${to}`],
        datasets: [{ label: 'Occupancy %', data: [o.occupancyRate], tension: 0.3 }],
      });
    });
    this.reportsApi.getRevenue(hid, from, to).subscribe((r) => {
      this.rev.set(r);
      const adrVal =
        r.totalBookings > 0 ? (Number(r.totalRevenue) / r.totalBookings).toFixed(0) : '0';
      this.adr.set(adrVal);
      const rooms = this.occ()?.totalRooms ?? 1;
      const revparVal = (Number(r.totalRevenue) / rooms).toFixed(0);
      this.revpar.set(revparVal);
      this.revChartData.set({
        labels: [`${from} → ${to}`],
        datasets: [{ label: 'Revenue $', data: [Number(r.totalRevenue)] }],
      });
    });
  }

}
