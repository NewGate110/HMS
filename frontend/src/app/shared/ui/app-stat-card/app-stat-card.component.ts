import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
    >
      <p class="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {{ label() }}
      </p>
      <p class="mt-2 text-2xl font-semibold tabular-nums text-zinc-900">
        {{ value() }}
      </p>
      @if (hint()) {
        <p class="mt-1 text-xs text-zinc-500">{{ hint() }}</p>
      }
    </article>
  `,
})
export class AppStatCardComponent {
  label = input.required<string>();
  value = input.required<string>();
  hint = input<string>('');
}
