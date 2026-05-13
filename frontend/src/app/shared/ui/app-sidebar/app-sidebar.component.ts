import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarNavItem {
  label: string;
  icon: string;
  link: readonly unknown[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="flex h-full flex-col border-r border-zinc-200/80 bg-white/90 backdrop-blur"
      [class.w-64]="!collapsed()"
      [class.w-[4.5rem]]="collapsed()"
    >
      <div class="flex h-14 items-center border-b border-zinc-200/80 px-4">
        <a href="/">
          @if (!collapsed()) {
            <img
              src="/logo-dark.png"
              alt="Grand Plaza"
              class="h-12 w-auto object-contain object-left"
            />
          } @else {
            <img src="/logo-dark.png" alt="Grand Plaza" class="h-10 object-contain object-center" />
          }
        </a>
      </div>
      <nav class="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Primary">
        @for (item of items(); track item.link.join('/')) {
          <a
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            [routerLink]="item.link"
            routerLinkActive="bg-zinc-100 text-zinc-900"
            [routerLinkActiveOptions]="{ exact: item.link.length <= 1 }"
          >
            <span class="material-icons-outlined text-[20px]" aria-hidden="true">{{
              item.icon
            }}</span>
            @if (!collapsed()) {
              <span>{{ item.label }}</span>
            }
          </a>
        }
      </nav>
      <button
        type="button"
        class="m-2 flex items-center justify-center gap-2 rounded-lg border border-zinc-200 px-2 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        (click)="toggleCollapse.emit()"
        [attr.aria-expanded]="!collapsed()"
        [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span class="material-icons-outlined text-[18px]" aria-hidden="true">
          {{ collapsed() ? 'chevron_right' : 'chevron_left' }}
        </span>
        @if (!collapsed()) {
          <span>Collapse</span>
        }
      </button>
    </aside>
  `,
})
export class AppSidebarComponent {
  items = input<SidebarNavItem[]>([]);
  collapsed = input(false);
  toggleCollapse = output<void>();
}
