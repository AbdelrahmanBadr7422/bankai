import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { errorMessage, isNotFound } from '../../core/errors';
import { NotifyService } from '../../core/notify.service';
import { OrderService } from '../../core/order.service';
import { Order } from '../../shared/models/api.models';
import { OrderView } from '../../shared/order-view';

@Component({
  selector: 'app-order-detail-page',
  imports: [RouterLink, OrderView],
  template: `
    <div class="page">
      <a routerLink="/orders" class="text-sm text-muted hover:text-blood">← My orders</a>
      @if (loading()) {
        <p class="mt-6 text-muted">Loading order…</p>
      } @else if (notFound()) {
        <h1 class="page-title mt-4">Order not found</h1>
      } @else if (error()) {
        <div class="alert-error mt-6" role="alert">{{ error() }}</div>
      } @else if (order(); as o) {
        <div class="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="page-title">Order {{ o.orderNumber }}</h1>
            <div class="rule"></div>
          </div>
          @if (o.status === 'PENDING') {
            <button
              type="button"
              class="btn btn-danger"
              [disabled]="cancelling()"
              (click)="cancel(o)"
            >
              {{ cancelling() ? 'Cancelling…' : 'Cancel order' }}
            </button>
          }
        </div>
        <div class="mt-6"><app-order-view [order]="o" /></div>
        @if (o.status !== 'PENDING' && o.status !== 'CANCELLED') {
          <p class="mt-6 text-sm text-muted">
            Only orders that are still pending can be cancelled.
          </p>
        }
      }
    </div>
  `,
})
export class OrderDetailPage {
  private orders = inject(OrderService);
  private notify = inject(NotifyService);

  protected order = signal<Order | null>(null);
  protected loading = signal(true);
  protected notFound = signal(false);
  protected error = signal('');
  protected cancelling = signal(false);

  constructor() {
    const id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
    this.orders.get(id).subscribe({
      next: (o) => {
        this.order.set(o);
        this.loading.set(false);
      },
      error: (e) => {
        if (isNotFound(e)) this.notFound.set(true);
        else this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected async cancel(o: Order) {
    if (
      !(await this.notify.confirm(
        `Cancel order ${o.orderNumber}? The books will go back to stock.`,
        'Cancel order',
      ))
    )
      return;
    this.cancelling.set(true);
    this.orders.cancel(o.id).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.notify.success('Order cancelled');
        this.cancelling.set(false);
      },
      error: (e) => {
        this.notify.error(errorMessage(e));
        this.cancelling.set(false);
      },
    });
  }
}
