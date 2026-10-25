import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/errors';
import { NotifyService } from '../../core/notify.service';
import { Page, Product } from '../../shared/models/api.models';
import { Pagination } from '../../shared/pagination';
import { MoneyPipe } from '../../shared/money.pipe';

@Component({
  selector: 'app-admin-products-page',
  imports: [RouterLink, MoneyPipe, Pagination],
  template: `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="page-title">Books</h1>
        <div class="rule"></div>
      </div>
      <a routerLink="/admin/products/new" class="btn btn-primary">Add book</a>
    </div>

    <form class="mt-6 flex gap-3" role="search" (submit)="$event.preventDefault(); search(q.value)">
      <input
        #q
        type="search"
        class="input max-w-sm"
        placeholder="Search by title"
        aria-label="Search by title"
      />
      <button type="submit" class="btn btn-dark">Search</button>
    </form>

    @if (error()) {
      <div class="alert-error mt-6" role="alert">{{ error() }}</div>
    }

    @if (loading()) {
      <p class="mt-8 text-muted">Loading books…</p>
    } @else if (result(); as r) {
      @if (r.content.length === 0) {
        <div class="panel mt-8">
          <p>No books found. Create a category first, then add a book.</p>
        </div>
      } @else {
        <div class="panel mt-6 overflow-x-auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Category</th>
                <th class="text-right">Price</th>
                <th class="text-right">Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (p of r.content; track p.id) {
                <tr>
                  <td>
                    <a
                      [routerLink]="['/admin/products', p.id, 'edit']"
                      class="font-semibold hover:text-blood"
                      >{{ p.title }}</a
                    >
                  </td>
                  <td>{{ p.author }}</td>
                  <td>{{ p.categoryName }}</td>
                  <td class="text-right">{{ p.price | money }}</td>
                  <td class="text-right">{{ p.stockQuantity }}</td>
                  <td>{{ p.active ? 'Active' : 'Inactive' }}</td>
                  <td class="whitespace-nowrap text-right">
                    <a
                      [routerLink]="['/admin/products', p.id, 'edit']"
                      class="btn btn-outline btn-sm"
                      >Edit</a
                    >
                    <button type="button" class="btn btn-danger btn-sm ml-1" (click)="remove(p)">
                      Delete
                    </button>
                  </td>
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
export class AdminProductsPage implements OnInit {
  private admin = inject(AdminService);
  private notify = inject(NotifyService);

  protected result = signal<Page<Product> | null>(null);
  protected loading = signal(true);
  protected error = signal('');
  private term = '';

  ngOnInit() {
    this.load(0);
  }

  protected search(term: string) {
    this.term = term.trim();
    this.load(0);
  }

  protected load(page: number) {
    this.loading.set(true);
    this.error.set('');
    this.admin.products(this.term, page).subscribe({
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

  protected async remove(p: Product) {
    if (
      !(await this.notify.confirm(
        `Delete "${p.title}" permanently? This cannot be undone.`,
        'Delete',
      ))
    )
      return;
    this.admin.deleteProduct(p.id).subscribe({
      next: () => {
        this.notify.success('Book deleted');
        this.load(this.result()?.page ?? 0);
      },
      error: (e) => this.notify.error(errorMessage(e)),
    });
  }
}
