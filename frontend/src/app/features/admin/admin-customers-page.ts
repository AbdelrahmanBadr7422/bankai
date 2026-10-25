import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/errors';
import { Page, User } from '../../shared/models/api.models';
import { Pagination } from '../../shared/pagination';

@Component({
  selector: 'app-admin-customers-page',
  imports: [DatePipe, Pagination],
  template: `
    <h1 class="page-title">Customers</h1>
    <div class="rule"></div>

    @if (error()) {
      <div class="alert-error mt-6" role="alert">{{ error() }}</div>
    }

    @if (loading()) {
      <p class="mt-8 text-muted">Loading customers…</p>
    } @else if (result(); as r) {
      @if (r.content.length === 0) {
        <div class="panel mt-6"><p>No customers have registered yet.</p></div>
      } @else {
        <p class="mt-6 text-sm text-muted">{{ r.totalElements }} customers</p>
        <div class="panel mt-2 overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              @for (u of r.content; track u.id) {
                <tr>
                  <td>{{ u.id }}</td>
                  <td>{{ u.fullName }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone || '—' }}</td>
                  <td>{{ u.createdAt | date: 'mediumDate' }}</td>
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
export class AdminCustomersPage implements OnInit {
  private admin = inject(AdminService);
  protected result = signal<Page<User> | null>(null);
  protected loading = signal(true);
  protected error = signal('');

  ngOnInit() {
    this.load(0);
  }

  protected load(page: number) {
    this.loading.set(true);
    this.admin.customers(page).subscribe({
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
