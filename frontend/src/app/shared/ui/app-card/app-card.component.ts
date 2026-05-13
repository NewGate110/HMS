import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm"
      [class]="paddingClass()"
    >
      @if (title()) {
        <header class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 class="text-base font-semibold tracking-tight text-zinc-900">
            {{ title() }}
          </h2>
          <ng-content select="[cardActions]" />
        </header>
      }
      <ng-content />
    </section>
  `,
})
export class AppCardComponent {
  title = input<string>('');
  paddingClass = input<string>('');
}
