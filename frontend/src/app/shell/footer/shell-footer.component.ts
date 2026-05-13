import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-shell-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer
      class="border-t border-zinc-200/80 bg-white/80 px-4 py-3 text-center text-xs text-zinc-500"
    >
      © {{ year }} Grand Plaza Hotel Management System
    </footer>
  `,
})
export class ShellFooterComponent {
  readonly year = new Date().getFullYear();
}
