import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from './models/api.models';
import { BookCover } from './book-cover';
import { MoneyPipe } from './money.pipe';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, BookCover, MoneyPipe],
  template: `
    <article class="group flex flex-col">
      <a [routerLink]="['/books', product().id]" class="block">
        <div class="aspect-2/3 overflow-hidden border border-ink/15 bg-bone">
          <app-book-cover [url]="product().coverImageUrl" [title]="product().title" />
        </div>
        <h3 class="mt-3 font-display text-lg leading-snug group-hover:text-blood">
          {{ product().title }}
        </h3>
      </a>
      <p class="text-sm text-muted">{{ product().author }}</p>
      <div class="mt-1 flex items-center justify-between">
        <span class="font-semibold">{{ product().price | money }}</span>
        @if (product().stockQuantity === 0) {
          <span class="text-xs uppercase tracking-wider text-blood">Sold out</span>
        }
      </div>
    </article>
  `,
})
export class ProductCard {
  product = input.required<Product>();
}
