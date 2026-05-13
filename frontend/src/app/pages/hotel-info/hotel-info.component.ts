import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HotelsApiService } from '../../core/services/hotels-api.service';
import { AppCardComponent } from '../../shared/ui/app-card/app-card.component';
import { AppLoaderComponent } from '../../shared/ui/app-loader/app-loader.component';
import { AppEmptyStateComponent } from '../../shared/ui/app-empty-state/app-empty-state.component';

@Component({
  selector: 'app-hotel-info',
  standalone: true,
  imports: [AppCardComponent, AppLoaderComponent, AppEmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-4xl space-y-6 px-4 py-12 text-zinc-900">
      <h1 class="text-3xl font-semibold tracking-tight">Our hotels</h1>
      @if (loading()) {
        <app-loader caption="Loading properties…" />
      } @else if (error()) {
        <app-empty-state icon="error_outline" title="Could not load hotels" [hint]="error()!" />
      } @else {
        <div class="grid gap-4 md:grid-cols-2">
          @for (h of hotels(); track h.id) {
            <app-card [title]="h.name">
              <p class="text-sm text-zinc-600">
                {{ h.city }}, {{ h.country }}
              </p>
            </app-card>
          }
        </div>
      }
    </div>
  `,
})
export class HotelInfoComponent {
  private readonly hotelsApi = inject(HotelsApiService);

  readonly hotels = signal<{ id: number; name: string; city: string; country: string }[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.hotelsApi.getAll().subscribe({
      next: (rows) => {
        this.hotels.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Please ensure the API is running (see README).');
        this.loading.set(false);
      },
    });
  }
}
