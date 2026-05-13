import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="animate-pulse rounded-lg bg-zinc-200/80"
      [style.width]="width()"
      [style.height]="height()"
      role="presentation"
    ></div>
  `,
})
export class AppSkeletonComponent {
  width = input<string>('100%');
  height = input<string>('1rem');
}
