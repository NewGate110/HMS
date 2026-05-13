import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MSG } from '../../../core/i18n/ui-messages';
import { AppButtonComponent } from '../app-button/app-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 px-6 py-14 text-center"
      role="status"
    >
      <span class="material-icons-outlined text-4xl text-zinc-400" aria-hidden="true">{{
        icon()
      }}</span>
      <h3 class="text-base font-semibold text-zinc-900">
        {{ title() }}
      </h3>
      <p class="max-w-sm text-sm text-zinc-600">
        {{ hint() }}
      </p>
      @if (actionLabel()) {
        <app-button variant="primary" (clicked)="action.emit()">{{ actionLabel() }}</app-button>
      }
    </div>
  `,
})
export class AppEmptyStateComponent {
  icon = input<string>('inbox');
  title = input<string>(MSG.empty.defaultTitle);
  hint = input<string>(MSG.empty.defaultHint);
  actionLabel = input<string>('');
  action = output<void>();
}
