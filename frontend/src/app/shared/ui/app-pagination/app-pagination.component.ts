import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [MatPaginatorModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-paginator
      [length]="length()"
      [pageSize]="pageSize()"
      [pageIndex]="pageIndex()"
      [pageSizeOptions]="pageSizeOptions()"
      [showFirstLastButtons]="true"
      (page)="onPage($event)"
    />
  `,
})
export class AppPaginationComponent {
  length = input(0);
  pageSize = input(10);
  pageIndex = input(0);
  pageSizeOptions = input<number[]>([5, 10, 25]);

  pageChange = output<PageEvent>();

  onPage(ev: PageEvent): void {
    this.pageChange.emit(ev);
  }
}
