import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-book-cover',
  template: `
    @if (url() && !failed()) {
      <img
        [src]="url()"
        [alt]="'Cover of ' + title()"
        class="h-full w-full object-cover"
        loading="lazy"
        (error)="failed.set(true)"
      />
    } @else {
      <div
        class="flex h-full w-full items-center justify-center bg-charcoal p-3 text-center font-display text-sm text-paper/80"
      >
        {{ title() }}
      </div>
    }
  `,
  host: { class: 'block h-full w-full' },
})
export class BookCover {
  url = input<string | null>(null);
  title = input.required<string>();
  protected failed = signal(false);
}
