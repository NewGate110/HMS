import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppAvatarComponent } from '../app-avatar/app-avatar.component';
import { AppBreadcrumbComponent, type BreadcrumbItem } from '../app-breadcrumb/app-breadcrumb.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [AppBreadcrumbComponent, AppAvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex h-14 items-center justify-between gap-4 border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur"
    >
      <div class="min-w-0 flex-1">
        <app-breadcrumb [items]="breadcrumbs()" />
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
          (click)="notifications.emit()"
          aria-label="Open notifications"
        >
          <span class="material-icons-outlined text-[22px]" aria-hidden="true">notifications</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-100"
          (click)="profileMenu.emit()"
          [attr.aria-label]="'Account menu for ' + displayName()"
        >
          <app-avatar [name]="displayName()" />
          <span class="hidden text-sm font-medium text-zinc-800 sm:inline">{{
            displayName()
          }}</span>
        </button>
      </div>
    </header>
  `,
})
export class AppNavbarComponent {
  breadcrumbs = input<BreadcrumbItem[]>([]);
  displayName = input('User');
  notifications = output<void>();
  profileMenu = output<void>();
}
