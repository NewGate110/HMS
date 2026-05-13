import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Styled container for Angular Material tables. */
@Component({
  selector: 'app-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-sm"
    >
      <ng-content />
    </div>
  `,
})
export class AppTableComponent {}
