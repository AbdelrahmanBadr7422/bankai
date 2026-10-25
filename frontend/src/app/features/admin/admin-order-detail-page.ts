import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { errorMessage, isNotFound } from '../../core/errors';
import { NotifyService } from '../../core/notify.service';
import { NEXT_STATUSES, Order, OrderStatus } from '../../shared/models/api.models';
import { OrderView } from '../../shared/order-view';

@Component({
  selector: 'app-admin-order-detail-page',
  imports: [RouterLink, OrderView],
  template: `
    <a routerLink="/admin/orders" class="text-sm text-muted hover:text-blood">← All orders</a>
    @if (loading()) {
      <p class="mt-6 text-muted">Loading order…</p>
    } @else if (notFound()) {
      <h1 class="page-title mt-4">Order not found</h1>
    } @else if (error()) {
      <div class="alert-error mt-6" role="alert">{{ error() }}</div>
    } @else if (order(); as o) {
      <h1 class="page-title mt-4">Order {{ o.orderNumber }}</h1>
      <div class="rule"></div>

      <section class="panel mt-6">
        <h2 class="mb-3 text-xl font-bold">Change status</h2>
        @if (nextStatuses(o).length === 0) {
          <p class="text-sm text-muted">
            This order is {{ o.status }}. No further changes are allowed.
          </p>
        } @else {
          <div class="flex flex-wrap gap-3">
            @for (s of nextStatuses(o); track s) {
              <button
                type="button"
                class="btn"
                [class.btn-danger]="s === 'CANCELLED'"
                [class.btn-dark]="s !== 'CANCELLED'"
                [disabled]="updating()"
                (click)="change(o, s)"
              >
                Mark as {{ s }}
              </button>
            }
          </div>
          <p class="mt-3 text-xs text-muted">
            Status changes cannot be undone. Cancelling returns the books to stock. Delivering marks
            the cash payment as paid.
          </p>
        }
      </section>

      <div class="mt-6"><app-order-view [order]="o" /></div>
    }
  `,
})
export class AdminOrderDetailPage {
  private admin = inject(AdminService);
  private notify = inject(NotifyService);

  protected order = signal<Order | null>(null);
  protected loading = signal(true);
  protected notFound = signal(false);
  protected error = signal('');
  protected updating = signal(false);

  constructor() {
    const id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
    this.admin.order(id).subscribe({
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

  protected nextStatuses(o: Order): OrderStatus[] {
    return NEXT_STATUSES[o.status];
  }

  protected async change(o: Order, status: OrderStatus) {
    if (
      !(await this.notify.confirm(
        `Change order ${o.orderNumber} from ${o.status} to ${status}? This cannot be undone.`,
        `Mark as ${status}`,
      ))
    )
      return;
    this.updating.set(true);
    this.admin.updateOrderStatus(o.id, status).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.notify.success(`Order is now ${updated.status}`);
        this.updating.set(false);
      },
      error: (e) => {
        this.notify.error(errorMessage(e));
        this.updating.set(false);
      },
    });
  }
}
