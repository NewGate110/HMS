import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppButtonComponent } from '../../shared/ui/app-button/app-button.component';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, AppButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center"
    >
      <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400">
        404
      </p>
      <h1 class="text-2xl font-semibold text-zinc-900">Page not found</h1>
      <p class="max-w-md text-sm text-zinc-600">
        The page you requested does not exist or was moved.
      </p>
      <a routerLink="/">
        <app-button variant="primary">Back home</app-button>
      </a>
    </main>
  `,
})
export class NotFoundComponent {}
