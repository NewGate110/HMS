import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      [ngClass]="palette()"
    >
      <ng-content />
    </span>
  `,
})
export class AppBadgeComponent {
  tone = input<'neutral' | 'success' | 'warning' | 'danger' | 'info'>('neutral');

  readonly palette = computed(() => {
    switch (this.tone()) {
      case 'success':
        return 'bg-emerald-100 text-emerald-800';
      case 'warning':
        return 'bg-amber-100 text-amber-900';
      case 'danger':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  });
}
