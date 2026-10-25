import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from './models/api.models';
import { StatusBadge } from './status-badge';
import { MoneyPipe } from './money.pipe';

@Component({
  selector: 'app-order-view',
  imports: [DatePipe, RouterLink, MoneyPipe, StatusBadge],
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <app-status-badge [status]="order().status" />
      <span class="text-sm text-muted"
        >Placed {{ order().createdAt | date: 'medium' }} · {{ order().customerEmail }}</span
      >
    </div>

    <div class="mt-6 grid gap-6 md:grid-cols-3">
      <section class="panel md:col-span-2">
        <h2 class="mb-4 text-xl font-bold">Items</h2>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th class="text-right">Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (i of order().items; track i.productId) {
                <tr>
                  <td>
                    <a [routerLink]="['/books', i.productId]" class="hover:text-blood">{{
                      i.productTitle
                    }}</a>
                  </td>
                  <td class="text-right">{{ i.unitPrice | money }}</td>
                  <td class="text-right">{{ i.quantity }}</td>
                  <td class="text-right">{{ i.lineTotal | money }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <aside class="space-y-6">
        <section class="panel text-sm">
          <h2 class="mb-3 text-xl font-bold">Summary</h2>
          <dl class="space-y-1">
            <div class="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{{ order().subtotal | money }}</dd>
            </div>
            <div class="flex justify-between">
              <dt>Shipping</dt>
              <dd>{{ order().shippingFee | money }}</dd>
            </div>
            <div class="flex justify-between border-t border-ink/15 pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{{ order().total | money }}</dd>
            </div>
          </dl>
          <p class="mt-4 flex items-center gap-2">
            Cash on delivery <app-status-badge [status]="order().paymentStatus" />
          </p>
        </section>
        <section class="panel text-sm">
          <h2 class="mb-3 text-xl font-bold">Ship to</h2>
          <address class="not-italic leading-relaxed">
            {{ order().shippingAddress.recipientName }}<br />
            {{ order().shippingAddress.line1 }}<br />
            @if (order().shippingAddress.line2) {
              {{ order().shippingAddress.line2 }}<br />
            }
            {{ order().shippingAddress.city }} {{ order().shippingAddress.postalCode }}<br />
            {{ order().shippingAddress.country }}<br />
            {{ order().shippingAddress.phone }}
          </address>
        </section>
      </aside>
    </div>
  `,
})
export class OrderView {
  order = input.required<Order>();
}
