import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AddressService } from '../../core/address.service';
import { CartService } from '../../core/cart.service';
import { errorMessage } from '../../core/errors';
import { NotifyService } from '../../core/notify.service';
import { OrderService } from '../../core/order.service';
import { Address } from '../../shared/models/api.models';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink, MoneyPipe],
  template: `
    <div class="page">
      <h1 class="page-title">Checkout</h1>
      <div class="rule"></div>

      @if (error()) {
        <div class="alert-error mt-6" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="mt-8 text-muted">Loading…</p>
      } @else if (cart.cart(); as c) {
        @if (c.items.length === 0) {
          <div class="panel mt-8">
            <p>Your cart is empty.</p>
            <a routerLink="/books" class="btn btn-dark mt-4">Browse books</a>
          </div>
        } @else {
          <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div class="space-y-8">
              <section aria-labelledby="addr-title">
                <h2 id="addr-title" class="text-xl font-bold">1. Shipping address</h2>
                @if (addresses().length === 0) {
                  <div class="panel mt-4">
                    <p>You need a shipping address before you can place an order.</p>
                    <a routerLink="/addresses" class="btn btn-primary mt-4">Add an address</a>
                  </div>
                } @else {
                  <fieldset class="mt-4 space-y-3">
                    <legend class="sr-only">Choose a shipping address</legend>
                    @for (a of addresses(); track a.id) {
                      <label
                        class="panel flex cursor-pointer items-start gap-3 text-sm"
                        [class.border-blood]="selectedId() === a.id"
                      >
                        <input
                          type="radio"
                          name="address"
                          class="mt-1 accent-blood"
                          [checked]="selectedId() === a.id"
                          (change)="selectedId.set(a.id)"
                        />
                        <span>
                          <strong>{{ a.recipientName }}</strong
                          ><br />
                          {{ a.line1 }}{{ a.line2 ? ', ' + a.line2 : '' }}, {{ a.city }}
                          {{ a.postalCode }}, {{ a.country }}<br />{{ a.phone }}
                        </span>
                      </label>
                    }
                  </fieldset>
                  <a routerLink="/addresses" class="mt-3 inline-block text-sm text-blood underline"
                    >Manage addresses</a
                  >
                }
              </section>

              <section aria-labelledby="pay-title">
                <h2 id="pay-title" class="text-xl font-bold">2. Payment</h2>
                <div class="panel mt-4 text-sm">
                  <p class="font-semibold">Cash on delivery</p>
                  <p class="text-muted">
                    Pay the courier when the order arrives. This is the only payment method
                    available.
                  </p>
                </div>
              </section>
            </div>

            <aside class="panel h-fit text-sm">
              <h2 class="mb-3 text-xl font-bold">Order summary</h2>
              <ul class="space-y-1">
                @for (i of c.items; track i.productId) {
                  <li class="flex justify-between gap-3">
                    <span>{{ i.quantity }} × {{ i.title }}</span
                    ><span>{{ i.lineTotal | money }}</span>
                  </li>
                }
              </ul>
              <dl class="mt-4 space-y-1 border-t border-ink/15 pt-3">
                <div class="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd>{{ c.subtotal | money }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{{ c.estimatedShippingFee | money }}</dd>
                </div>
                <div class="flex justify-between text-base font-bold">
                  <dt>Total</dt>
                  <dd>{{ c.total | money }}</dd>
                </div>
              </dl>
              <button
                type="button"
                class="btn btn-primary mt-5 w-full"
                [disabled]="placing() || selectedId() === null"
                (click)="placeOrder()"
              >
                {{ placing() ? 'Placing order…' : 'Place order' }}
              </button>
              <p class="mt-3 text-xs text-muted">
                The server rechecks stock and recalculates the total when you place the order.
              </p>
            </aside>
          </div>
        }
      }
    </div>
  `,
})
export class CheckoutPage implements OnInit {
  protected cart = inject(CartService);
  private addressApi = inject(AddressService);
  private orders = inject(OrderService);
  private notify = inject(NotifyService);
  private router = inject(Router);

  protected addresses = signal<Address[]>([]);
  protected selectedId = signal<number | null>(null);
  protected loading = signal(true);
  protected placing = signal(false);
  protected error = signal('');

  ngOnInit() {
    forkJoin({ cart: this.cart.load(), addresses: this.addressApi.list() }).subscribe({
      next: ({ addresses }) => {
        this.addresses.set(addresses);
        this.selectedId.set(addresses[0]?.id ?? null);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected placeOrder() {
    const addressId = this.selectedId();
    if (addressId === null) return;
    this.placing.set(true);
    this.orders.checkout(addressId).subscribe({
      next: (order) => {
        this.cart.load().subscribe({ error: () => undefined });
        this.notify.success(`Order ${order.orderNumber} placed`);
        this.router.navigate(['/orders', order.id]);
      },
      error: (e) => {
        this.notify.error(errorMessage(e));
        this.placing.set(false);
        this.cart.load().subscribe({ error: () => undefined });
      },
    });
  }
}
