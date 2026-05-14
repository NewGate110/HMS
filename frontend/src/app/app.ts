import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InactivityService } from './core/auth/inactivity.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    // Start the 15-min inactivity timer for the whole application session.
    inject(InactivityService).start();
  }
}
