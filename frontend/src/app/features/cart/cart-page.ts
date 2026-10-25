import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/cart.service';
import { errorMessage } from '../../core/errors';
import { NotifyService } from '../../core/notify.service';
import { CartItem } from '../../shared/models/api.models';
import { BookCover } from '../../shared/book-cover';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, BookCover, MoneyPipe],
  template: `
    <div class="page">
      <h1 class="page-title">Your cart</h1>
      <div class="rule"></div>

      @if (error()) {
        <div class="alert-error mt-6" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="mt-8 text-muted">Loading your cart…</p>
      } @else if (cart.cart(); as c) {
        @if (c.items.length === 0) {
          <div class="panel mt-8">
            <p>Your cart is empty.</p>
            <a routerLink="/books" class="btn btn-dark mt-4">Browse books</a>
          </div>
        } @else {
          <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
            <ul class="divide-y divide-ink/15 border-y border-ink/15">
              @for (i of c.items; track i.productId) {
                <li class="flex gap-4 py-4">
                  <div class="h-24 w-16 shrink-0 overflow-hidden border border-ink/15 bg-bone">
                    <app-book-cover [url]="i.coverImageUrl" [title]="i.title" />
                  </div>
                  <div
                    class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <a
                        [routerLink]="['/books', i.productId]"
                        class="font-display text-lg hover:text-blood"
                        >{{ i.title }}</a
                      >
                      <p class="text-sm text-muted">
                        {{ i.unitPrice | money }} each · {{ i.availableStock }} in stock
                      </p>
                    </div>
                    <div class="flex items-center gap-3">
                      <label class="sr-only" [attr.for]="'qty-' + i.productId"
                        >Quantity for {{ i.title }}</label
                      >
                      <input
                        [id]="'qty-' + i.productId"
                        #q
                        type="number"
                        min="1"
                        max="100"
                        class="input w-20"
                        [value]="i.quantity"
                        (change)="setQuantity(i, q)"
                      />
                      <span class="w-20 text-right font-semibold">{{ i.lineTotal | money }}</span>
                      <button type="button" class="btn btn-outline btn-sm" (click)="remove(i)">
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              }
            </ul>

            <aside class="panel h-fit text-sm">
              <h2 class="mb-3 text-xl font-bold">Summary</h2>
              <dl class="space-y-1">
                <div class="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{{ c.subtotal | money }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt>Estimated shipping</dt>
                  <dd>{{ c.estimatedShippingFee | money }}</dd>
                </div>
                <div class="flex justify-between border-t border-ink/15 pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd>{{ c.total | money }}</dd>
                </div>
              </dl>
              <p class="mt-3 text-xs text-muted">
                Prices and totals are recalculated by the server at checkout.
              </p>
              <a routerLink="/checkout" class="btn btn-primary mt-4 w-full">Proceed to checkout</a>
              <button type="button" class="btn btn-outline mt-2 w-full" (click)="clear()">
                Clear cart
              </button>
            </aside>
          </div>
        }
      }
    </div>
  `,
})
export class CartPage implements OnInit {
  protected cart = inject(CartService);
  private notify = inject(NotifyService);
  protected loading = signal(true);
  protected error = signal('');

  ngOnInit() {
    this.cart.load().subscribe({
      next: () => this.loading.set(false),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected setQuantity(item: CartItem, input: HTMLInputElement) {
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      this.notify.error('Quantity must be a whole number between 1 and 100.');
      input.value = String(item.quantity);
      return;
    }
    this.cart.update(item.productId, quantity).subscribe({
      error: (e) => {
        this.notify.error(errorMessage(e));
        input.value = String(item.quantity);
      },
    });
  }

  protected remove(item: CartItem) {
    this.cart
      .remove(item.productId)
      .subscribe({ error: (e) => this.notify.error(errorMessage(e)) });
  }

  protected async clear() {
    if (!(await this.notify.confirm('Remove all books from your cart?', 'Clear cart'))) return;
    this.cart.clear().subscribe({ error: (e) => this.notify.error(errorMessage(e)) });
  }
}
