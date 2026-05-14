import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { AppStatCardComponent } from '../../../shared/ui/app-stat-card/app-stat-card.component';
import { AppCardComponent } from '../../../shared/ui/app-card/app-card.component';
import { AppButtonComponent } from '../../../shared/ui/app-button/app-button.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, AppStatCardComponent, AppCardComponent, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold text-zinc-900">System administration</h1>
      <div class="grid gap-4 sm:grid-cols-3">
        <app-stat-card label="Hotels" [value]="hotels().toString()" />
        <app-stat-card label="Staff accounts" [value]="staff().toString()" />
        <app-stat-card label="Audit events (24h)" [value]="auditEvents24h().toString()" />
      </div>
      <app-card title="Shortcuts">
        <div class="mt-4 flex flex-wrap gap-2">
          <a routerLink="/app/admin/users" class="inline-block">
            <app-button variant="secondary" type="button">Users</app-button>
          </a>
          <a routerLink="/app/admin/config" class="inline-block">
            <app-button variant="secondary" type="button">Configuration</app-button>
          </a>
          <a routerLink="/app/admin/audit" class="inline-block">
            <app-button variant="secondary" type="button">Audit logs</app-button>
          </a>
        </div>
      </app-card>
    </div>
  `,
})
export class AdminDashboardComponent {
  private readonly adminApi = inject(AdminApiService);

  readonly hotels = signal(0);
  readonly staff = signal(0);
  readonly auditEvents24h = signal(0);

  constructor() {
    this.adminApi.getHotels().subscribe((h) => this.hotels.set(h.length));
    this.adminApi.getStaff().subscribe((s) => this.staff.set(s.length));
    const cutoff = new Date(Date.now() - 86_400_000);
    this.adminApi.getAuditLogs().subscribe((logs) =>
      this.auditEvents24h.set(logs.filter((l) => new Date(l.timestamp) >= cutoff).length),
    );
  }
}
