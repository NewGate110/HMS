import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col items-center justify-center gap-3 py-10"
      [attr.aria-busy]="true"
      [attr.aria-label]="label()"
    >
      <mat-spinner [diameter]="diameter()" />
      @if (caption()) {
        <p class="text-sm text-zinc-500">{{ caption() }}</p>
      }
    </div>
  `,
})
export class AppLoaderComponent {
  diameter = input(40);
  caption = input('');
  label = input('Loading');
}
