import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block' },
  template: `
    <button
      [attr.type]="type()"
      [disabled]="disabled()"
      (click)="clicked.emit($event)"
      class="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50"
      [ngClass]="classes()"
    >
      @if (loading()) {
        <span
          class="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        ></span>
      }
      <ng-content />
    </button>
  `,
})
export class AppButtonComponent {
  type = input<'button' | 'submit'>('button');
  variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  disabled = input(false);
  loading = input(false);
  clicked = output<MouseEvent>();

  readonly classes = computed(() => {
    switch (this.variant()) {
      case 'secondary':
        return 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 active:scale-[0.98]';
      case 'ghost':
        return 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 active:scale-[0.98]';
      default:
        return 'bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]';
    }
  });
}
