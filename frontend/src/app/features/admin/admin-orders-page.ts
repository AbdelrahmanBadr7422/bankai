import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/errors';
import { ORDER_STATUSES, OrderSummary, Page } from '../../shared/models/api.models';
import { Pagination } from '../../shared/pagination';
import { StatusBadge } from '../../shared/status-badge';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-admin-orders-page',
  imports: [DatePipe, RouterLink, MoneyPipe, Pagination, StatusBadge],
  template: `
    <h1 class="page-title">Orders</h1>
    <div class="rule"></div>

    <div class="mt-6 max-w-xs">
      <label class="label" for="status-filter">Filter by status</label>
      <select #s id="status-filter" class="input" (change)="filter(s.value)">
        <option value="">All statuses</option>
        @for (st of statuses; track st) {
          <option [value]="st">{{ st }}</option>
        }
      </select>
    </div>

    @if (error()) {
      <div class="alert-error mt-6" role="alert">{{ error() }}</div>
    }

    @if (loading()) {
      <p class="mt-8 text-muted">Loading orders…</p>
    } @else if (result(); as r) {
      @if (r.content.length === 0) {
        <div class="panel mt-6"><p>No orders found.</p></div>
      } @else {
        <div class="panel mt-6 overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
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
                      [routerLink]="['/admin/orders', o.id]"
                      class="font-semibold text-blood underline"
                      >{{ o.orderNumber }}</a
                    >
                  </td>
                  <td>{{ o.customerEmail }}</td>
                  <td>{{ o.createdAt | date: 'short' }}</td>
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
  `,
})
export class AdminOrdersPage implements OnInit {
  private admin = inject(AdminService);
  protected statuses = ORDER_STATUSES;
  protected result = signal<Page<OrderSummary> | null>(null);
  protected loading = signal(true);
  protected error = signal('');
  private status = '';

  ngOnInit() {
    this.load(0);
  }

  protected filter(status: string) {
    this.status = status;
    this.load(0);
  }

  protected load(page: number) {
    this.loading.set(true);
    this.error.set('');
    this.admin.orders(this.status, page).subscribe({
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
