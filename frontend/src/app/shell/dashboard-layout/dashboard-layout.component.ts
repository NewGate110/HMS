import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DialogService } from '../../core/services/dialog.service';
import { sidebarItemsForRole } from '../../core/constants/nav';
import type { UserRole } from '../../core/constants/roles';
import { AppSidebarComponent } from '../../shared/ui/app-sidebar/app-sidebar.component';
import type { BreadcrumbItem } from '../../shared/ui/app-breadcrumb/app-breadcrumb.component';
import { AppBreadcrumbComponent } from '../../shared/ui/app-breadcrumb/app-breadcrumb.component';
import { AppAvatarComponent } from '../../shared/ui/app-avatar/app-avatar.component';
import { ShellFooterComponent } from '../footer/shell-footer.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatListModule,
    AppSidebarComponent,
    AppBreadcrumbComponent,
    AppAvatarComponent,
    ShellFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen bg-zinc-50">
      @if (isHandset() && mobileNavOpen()) {
        <div
          class="fixed inset-0 z-30 bg-black/40"
          role="presentation"
          (click)="mobileNavOpen.set(false)"
        ></div>
      }
      <div
        class="shrink-0 border-r border-zinc-200/80 bg-white"
        [class.hidden]="isHandset() && !mobileNavOpen()"
        [class.fixed]="isHandset()"
        [class.z-40]="isHandset()"
        [class.h-full]="isHandset()"
      >
        <app-sidebar
          [items]="navItems()"
          [collapsed]="sidebarCollapsed()"
          (toggleCollapse)="sidebarCollapsed.update((v) => !v)"
        />
      </div>
      <div class="flex min-w-0 flex-1 flex-col">
        <header
          class="flex h-14 items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/90 px-3 backdrop-blur md:px-4"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2">
            @if (isHandset()) {
              <button
                mat-icon-button
                type="button"
                aria-label="Open navigation menu"
                (click)="mobileNavOpen.update((v) => !v)"
              >
                <span class="material-icons-outlined">menu</span>
              </button>
            }
            <div class="min-w-0">
              <app-breadcrumb [items]="breadcrumbs()" />
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button
              mat-icon-button
              type="button"
              aria-label="Open notifications"
              class="flex items-center"
              (click)="notifOpen.update((v) => !v)"
            >
              <span class="material-icons-outlined">notifications</span>
            </button>
            <button
              mat-icon-button
              type="button"
              [matMenuTriggerFor]="accountMenu"
              class="relative flex items-center justify-center p-0"
            >
              <app-avatar class="absolute inset-0" [name]="auth.fullName() ?? 'User'"></app-avatar>
            </button>
            <mat-menu #accountMenu="matMenu">
              <button mat-menu-item type="button" (click)="confirmLogout()">Sign out</button>
            </mat-menu>
          </div>
        </header>
        <main class="flex-1 px-3 py-4 md:px-6">
          <router-outlet />
        </main>
        <app-shell-footer />
      </div>
      @if (notifOpen()) {
        <div
          class="fixed inset-0 z-40 bg-black/40"
          role="presentation"
          (click)="notifOpen.set(false)"
        ></div>
        <aside
          class="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-xl"
          aria-label="Notifications"
        >
          <div class="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 class="text-sm font-semibold text-zinc-900">Notifications</h2>
            <button
              type="button"
              class="rounded p-1 text-zinc-500 hover:bg-zinc-100"
              (click)="notifOpen.set(false)"
              aria-label="Close notifications"
            >
              <span class="material-icons-outlined text-[20px]">close</span>
            </button>
          </div>
          <mat-nav-list>
            <a mat-list-item>
              <span matListItemTitle class="text-sm">Front desk</span>
              <span matListItemLine class="text-xs text-zinc-500">No critical alerts</span>
            </a>
          </mat-nav-list>
        </aside>
      }
    </div>
  `,
})
export class DashboardLayoutComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly dialog = inject(DialogService);
  private readonly router = inject(Router);

  readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe([Breakpoints.Handset])
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly sidebarCollapsed = signal(false);
  readonly mobileNavOpen = signal(false);
  readonly notifOpen = signal(false);

  readonly navItems = computed(() => {
    const r = this.auth.role() as UserRole | null;
    return r ? sidebarItemsForRole(r) : [];
  });

  readonly breadcrumbs = signal<BreadcrumbItem[]>([{ label: 'Home', link: ['/'] }]);

  constructor() {
    this.theme.init();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        map(() => this.buildBreadcrumbs()),
      )
      .subscribe((b) => this.breadcrumbs.set(b));
  }

  confirmLogout(): void {
    this.dialog.confirm({ title: 'Sign out', message: 'Are you sure you want to sign out?', confirmLabel: 'Sign out' })
      .subscribe((confirmed) => { if (confirmed) this.auth.logout(); });
  }

  private buildBreadcrumbs(): BreadcrumbItem[] {
    const root: BreadcrumbItem = { label: 'Home', link: ['/'] };
    const path = this.router.url.split('?')[0] ?? '';
    const segments = path.split('/').filter(Boolean);
    if (segments[0] === 'app') {
      const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', link: ['/app'] }];
      let acc = '/app';
      for (let i = 1; i < segments.length; i++) {
        acc += '/' + segments[i];
        const raw = segments[i]!;
        const label = raw.replace(/-/g, ' ');
        if (['guest', 'dashboard'].includes(label.toLocaleLowerCase())) continue;
        crumbs.push({
          label: label.charAt(0).toUpperCase() + label.slice(1),
          link: [acc],
        });
      }
      return crumbs;
    }
    return [root];
  }
}
