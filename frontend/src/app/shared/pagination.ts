import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  template: `
    @if (totalPages() > 1) {
      <nav class="mt-8 flex items-center justify-center gap-4" aria-label="Pagination">
        <button
          type="button"
          class="btn btn-outline btn-sm"
          [disabled]="page() === 0"
          (click)="pageChange.emit(page() - 1)"
        >
          Previous
        </button>
        <span class="text-sm">Page {{ page() + 1 }} of {{ totalPages() }}</span>
        <button
          type="button"
          class="btn btn-outline btn-sm"
          [disabled]="page() >= totalPages() - 1"
          (click)="pageChange.emit(page() + 1)"
        >
          Next
        </button>
      </nav>
    }
  `,
})
export class Pagination {
  page = input.required<number>();
  totalPages = input.required<number>();
  pageChange = output<number>();
}
