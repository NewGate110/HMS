import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string | readonly unknown[];
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb" class="text-sm text-zinc-500">
      <ol class="flex flex-wrap items-center gap-2">
        @for (item of items(); track $index; let last = $last) {
          <li class="flex items-center gap-2">
            @if (!last && item.link) {
              <a
                class="font-medium text-zinc-600 hover:text-zinc-900"
                [routerLink]="item.link"
                >{{ item.label }}</a
              >
            } @else {
              <span [class.font-semibold]="last" [class.text-zinc-900]="last">
                {{ item.label }}
              </span>
            }
            @if (!last) {
              <span aria-hidden="true" class="text-zinc-400">/</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class AppBreadcrumbComponent {
  items = input<BreadcrumbItem[]>([]);
}
