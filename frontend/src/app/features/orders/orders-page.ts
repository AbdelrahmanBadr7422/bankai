import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../core/errors';
import { OrderService } from '../../core/order.service';
import { OrderSummary, Page } from '../../shared/models/api.models';
import { Pagination } from '../../shared/pagination';
import { StatusBadge } from '../../shared/status-badge';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-orders-page',
  imports: [DatePipe, RouterLink, MoneyPipe, Pagination, StatusBadge],
  template: `
    <div class="page">
      <h1 class="page-title">My orders</h1>
      <div class="rule"></div>

      @if (error()) {
        <div class="alert-error mt-6" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="mt-8 text-muted">Loading orders…</p>
      } @else if (result(); as r) {
        @if (r.content.length === 0) {
          <div class="panel mt-8">
            <p>You have not placed any orders yet.</p>
            <a routerLink="/books" class="btn btn-dark mt-4">Browse books</a>
          </div>
        } @else {
          <div class="panel mt-8 overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                @for (o of r.content; track o.id) {
                  <tr>
                    <td>
                      <a
                        [routerLink]="['/orders', o.id]"
                        class="font-semibold text-blood underline"
                        >{{ o.orderNumber }}</a
                      >
                    </td>
                    <td>{{ o.createdAt | date: 'medium' }}</td>
                    <td><app-status-badge [status]="o.status" /></td>
                    <td><app-status-badge [status]="o.paymentStatus" /></td>
                    <td class="text-right">{{ o.total | money }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-pagination [page]="r.page" [totalPages]="r.totalPages" (pageChange)="load($event)" />
        }
      }
    </div>
  `,
})
export class OrdersPage implements OnInit {
  private orders = inject(OrderService);
  protected result = signal<Page<OrderSummary> | null>(null);
  protected loading = signal(true);
  protected error = signal('');

  ngOnInit() {
    this.load(0);
  }

  protected load(page: number) {
    this.loading.set(true);
    this.orders.list(page).subscribe({
      next: (r) => {
        this.result.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
