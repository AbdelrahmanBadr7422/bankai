import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/errors';
import { Dashboard, ORDER_STATUSES } from '../../shared/models/api.models';
import { StatusBadge } from '../../shared/status-badge';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [DatePipe, RouterLink, MoneyPipe, StatusBadge],
  template: `
    <h1 class="page-title">Dashboard</h1>
    <div class="rule"></div>

    @if (error()) {
      <div class="alert-error mt-6" role="alert">{{ error() }}</div>
    }
    @if (!data() && !error()) {
      <p class="mt-8 text-muted">Loading dashboard…</p>
    }

    @if (data(); as d) {
      <div class="mt-8 grid gap-4 sm:grid-cols-3">
        <div class="panel">
          <p class="label">Total orders</p>
          <p class="font-display text-3xl font-bold">{{ d.totalOrders }}</p>
        </div>
        <div class="panel">
          <p class="label">Revenue (delivered orders)</p>
          <p class="font-display text-3xl font-bold">{{ d.totalRevenue | money }}</p>
        </div>
        <div class="panel">
          <p class="label">Customers</p>
          <p class="font-display text-3xl font-bold">{{ d.totalCustomers }}</p>
        </div>
      </div>

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <section class="panel">
          <h2 class="mb-3 text-xl font-bold">Orders by status</h2>
          <ul>
            @for (s of statuses; track s) {
              <li class="flex items-center justify-between border-b border-ink/10 py-2">
                <app-status-badge [status]="s" /><span class="font-semibold">{{
                  d.ordersByStatus[s]
                }}</span>
              </li>
            }
          </ul>
        </section>

        <section class="panel">
          <h2 class="mb-3 text-xl font-bold">Low stock (≤ {{ d.lowStockThreshold }})</h2>
          @if (d.lowStockProducts.length === 0) {
            <p class="text-sm text-muted">No active books are low on stock.</p>
          } @else {
            <table class="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th class="text-right">Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of d.lowStockProducts; track p.id) {
                  <tr>
                    <td>{{ p.title }}</td>
                    <td class="text-right">{{ p.stockQuantity }}</td>
                    <td class="text-right">
                      <a
                        [routerLink]="['/admin/products', p.id, 'edit']"
                        class="text-blood underline"
                        >Edit</a
                      >
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>
      </div>

      <section class="panel mt-6 overflow-x-auto">
        <h2 class="mb-3 text-xl font-bold">Recent orders</h2>
        @if (d.recentOrders.length === 0) {
          <p class="text-sm text-muted">No orders yet.</p>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              @for (o of d.recentOrders; track o.id) {
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
                  <td class="text-right">{{ o.total | money }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    }
  `,
})
export class AdminDashboardPage implements OnInit {
  private admin = inject(AdminService);
  protected data = signal<Dashboard | null>(null);
  protected error = signal('');
  protected statuses = ORDER_STATUSES;

  ngOnInit() {
    this.admin.dashboard().subscribe({
      next: (d) => this.data.set(d),
      error: (e) => this.error.set(errorMessage(e)),
    });
  }
}
