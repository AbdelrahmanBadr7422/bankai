import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CartService } from '../../core/cart.service';
import { CatalogService } from '../../core/catalog.service';
import { errorMessage, isNotFound } from '../../core/errors';
import { NotifyService } from '../../core/notify.service';
import { Product } from '../../shared/models/api.models';
import { BookCover } from '../../shared/book-cover';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-product-detail-page',
  imports: [ReactiveFormsModule, RouterLink, BookCover, MoneyPipe],
  template: `
    <div class="page">
      @if (loading()) {
        <p class="text-muted">Loading…</p>
      } @else if (notFound()) {
        <h1 class="page-title">Book not found</h1>
        <p class="mt-2 text-muted">It may have been removed or is no longer available.</p>
        <a routerLink="/books" class="btn btn-dark mt-6">Back to books</a>
      } @else if (error()) {
        <div class="alert-error" role="alert">{{ error() }}</div>
      } @else if (product(); as p) {
        <a routerLink="/books" class="text-sm text-muted hover:text-blood">← All books</a>
        <div class="mt-6 grid gap-10 md:grid-cols-[18rem_1fr]">
          <div class="aspect-2/3 overflow-hidden border border-ink/15 bg-bone">
            <app-book-cover [url]="p.coverImageUrl" [title]="p.title" />
          </div>
          <div>
            <a
              [routerLink]="['/books']"
              [queryParams]="{ categoryId: p.categoryId }"
              class="text-xs uppercase tracking-widest text-blood"
              >{{ p.categoryName }}</a
            >
            <h1 class="page-title mt-1 text-4xl">{{ p.title }}</h1>
            <p class="mt-1 text-muted">by {{ p.author }}</p>
            <p class="mt-6 text-3xl font-bold">{{ p.price | money }}</p>
            <p class="mt-1 text-sm" [class.text-blood]="p.stockQuantity === 0">
              {{
                p.stockQuantity > 0
                  ? 'In stock (' + p.stockQuantity + ' available)'
                  : 'Out of stock'
              }}
            </p>

            <form
              class="mt-6 flex items-end gap-3"
              (submit)="$event.preventDefault(); addToCart(p)"
            >
              <label>
                <span class="label">Quantity</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  class="input w-24"
                  [formControl]="quantity"
                />
              </label>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="adding() || p.stockQuantity === 0 || quantity.invalid"
              >
                {{ adding() ? 'Adding…' : 'Add to cart' }}
              </button>
            </form>

            @if (p.description) {
              <p class="mt-8 max-w-prose whitespace-pre-line leading-relaxed">
                {{ p.description }}
              </p>
            }
            <p class="mt-8 text-xs text-muted">ISBN {{ p.isbn }}</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProductDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalog = inject(CatalogService);
  private cart = inject(CartService);
  private auth = inject(AuthService);
  private notify = inject(NotifyService);

  protected product = signal<Product | null>(null);
  protected loading = signal(true);
  protected notFound = signal(false);
  protected error = signal('');
  protected adding = signal(false);
  protected quantity = new FormControl(1, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(1), Validators.max(100)],
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.catalog.product(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
      },
      error: (e) => {
        if (isNotFound(e)) this.notFound.set(true);
        else this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected addToCart(p: Product) {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.adding.set(true);
    this.cart.add(p.id, this.quantity.value).subscribe({
      next: () => {
        this.notify.success(`Added "${p.title}" to your cart`);
        this.adding.set(false);
      },
      error: (e) => {
        this.notify.error(errorMessage(e));
        this.adding.set(false);
      },
    });
  }
}
