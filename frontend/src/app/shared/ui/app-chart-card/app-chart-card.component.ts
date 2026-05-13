import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [BaseChartDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
    >
      <h3 class="mb-4 text-sm font-semibold text-zinc-900">
        {{ title() }}
      </h3>
      <div class="h-64">
        <canvas baseChart [type]="type()" [data]="data()" [options]="options()"></canvas>
      </div>
    </section>
  `,
})
export class AppChartCardComponent {
  title = input.required<string>();
  type = input<ChartConfiguration['type']>('line');
  data = input.required<ChartConfiguration['data']>();
  options = input<ChartConfiguration['options']>({ responsive: true, maintainAspectRatio: false });
}
