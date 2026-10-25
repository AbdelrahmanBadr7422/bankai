import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { errorMessage } from '../../core/errors';
import { Category, Product } from '../../shared/models/api.models';
import { ProductCard } from '../../shared/product-card';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, ProductCard],
  template: `
    <section class="relative overflow-hidden bg-ink text-paper">
      <div
        class="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 select-none font-display text-[16rem] leading-none text-paper/5"
        aria-hidden="true"
      >
        卍解
      </div>
      <div class="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <p class="mb-4 text-xs uppercase tracking-[0.35em] text-blood">本屋 · Bookstore</p>
        <h1 class="max-w-xl font-display text-4xl font-bold leading-tight sm:text-6xl">
          Books worth staying up for.
        </h1>
        <p class="mt-4 max-w-md text-paper/70">
          Browse the catalogue, add what you like to your cart and pay cash on delivery.
        </p>
        <a routerLink="/books" class="btn btn-primary mt-8">Browse books</a>
      </div>
      <div class="absolute inset-x-0 bottom-0 h-1 bg-blood"></div>
    </section>

    <div class="page">
      @if (categories().length > 0) {
        <section aria-labelledby="cat-title">
          <h2 id="cat-title" class="page-title text-2xl">Categories</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            @for (c of categories(); track c.id) {
              <a
                [routerLink]="['/books']"
                [queryParams]="{ categoryId: c.id }"
                class="btn btn-outline btn-sm"
                >{{ c.name }}</a
              >
            }
          </div>
        </section>
      }

      <section class="mt-12" aria-labelledby="latest-title">
        <div class="flex items-end justify-between">
          <div>
            <h2 id="latest-title" class="page-title text-2xl">Latest books</h2>
            <div class="rule"></div>
          </div>
          <a routerLink="/books" class="text-sm text-blood underline">View all</a>
        </div>
        @if (error()) {
          <div class="alert-error mt-6" role="alert">{{ error() }}</div>
        } @else if (loading()) {
          <p class="mt-8 text-muted">Loading books…</p>
        } @else if (products().length === 0) {
          <div class="panel mt-8">
            <p>There are no books in the catalogue yet.</p>
            @if (auth.isAdmin()) {
              <a routerLink="/admin/products/new" class="btn btn-primary mt-4"
                >Add the first book</a
              >
            } @else {
              <p class="mt-1 text-sm text-muted">Please check back soon.</p>
            }
          </div>
        } @else {
          <div class="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            @for (p of products(); track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class HomePage implements OnInit {
  private catalog = inject(CatalogService);
  protected auth = inject(AuthService);
  protected products = signal<Product[]>([]);
  protected categories = signal<Category[]>([]);
  protected loading = signal(true);
  protected error = signal('');

  ngOnInit() {
    this.catalog.products({ size: 8, sort: 'createdAt', direction: 'desc' }).subscribe({
      next: (page) => {
        this.products.set(page.content);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
    this.catalog
      .categories()
      .subscribe({ next: (c) => this.categories.set(c), error: () => undefined });
  }
}
