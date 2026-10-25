import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CatalogService } from '../../core/catalog.service';
import { errorMessage } from '../../core/errors';
import { Category, Page, Product } from '../../shared/models/api.models';
import { Pagination } from '../../shared/pagination';
import { ProductCard } from '../../shared/product-card';

@Component({
  selector: 'app-catalog-page',
  imports: [ReactiveFormsModule, RouterLink, ProductCard, Pagination],
  template: `
    <div class="page">
      <h1 class="page-title">Books</h1>
      <div class="rule"></div>

      <form
        [formGroup]="form"
        (ngSubmit)="apply()"
        class="mt-6 grid gap-3 sm:grid-cols-[1fr_12rem_13rem_auto]"
        role="search"
      >
        <input
          type="search"
          formControlName="search"
          class="input"
          placeholder="Search by title"
          aria-label="Search by title"
        />
        <select formControlName="categoryId" class="input" aria-label="Category">
          <option value="">All categories</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
        <select formControlName="sort" class="input" aria-label="Sort by">
          <option value="createdAt,desc">Newest first</option>
          <option value="title,asc">Title A–Z</option>
          <option value="price,asc">Price: low to high</option>
          <option value="price,desc">Price: high to low</option>
        </select>
        <button type="submit" class="btn btn-dark">Search</button>
      </form>

      @if (error()) {
        <div class="alert-error mt-6" role="alert">{{ error() }}</div>
      }

      @if (loading()) {
        <p class="mt-10 text-muted">Loading books…</p>
      } @else if (result(); as r) {
        @if (r.content.length === 0) {
          <div class="panel mt-8">
            <p>No books match your search.</p>
            <button type="button" class="btn btn-outline mt-4" (click)="reset()">
              Clear filters
            </button>
            @if (auth.isAdmin()) {
              <a routerLink="/admin/products/new" class="btn btn-primary ml-2 mt-4">Add a book</a>
            }
          </div>
        } @else {
          <p class="mt-6 text-sm text-muted">
            {{ r.totalElements }} {{ r.totalElements === 1 ? 'book' : 'books' }}
          </p>
          <div class="mt-4 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            @for (p of r.content; track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
          <app-pagination
            [page]="r.page"
            [totalPages]="r.totalPages"
            (pageChange)="goToPage($event)"
          />
        }
      }
    </div>
  `,
})
export class CatalogPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private catalog = inject(CatalogService);
  protected auth = inject(AuthService);

  protected categories = signal<Category[]>([]);
  protected result = signal<Page<Product> | null>(null);
  protected loading = signal(true);
  protected error = signal('');
  protected form = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl('', { nonNullable: true }),
    sort: new FormControl('createdAt,desc', { nonNullable: true }),
  });

  constructor() {
    this.catalog
      .categories()
      .subscribe({ next: (c) => this.categories.set(c), error: () => undefined });
    this.form.controls.categoryId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.apply());
    this.form.controls.sort.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.apply());

    // The URL is the single source of truth for filters, page and sort.
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const sort = params.get('sort') ?? 'createdAt';
          const direction = params.get('direction') ?? 'desc';
          this.loading.set(true);
          this.error.set('');
          this.form.setValue(
            {
              search: params.get('search') ?? '',
              categoryId: params.get('categoryId') ?? '',
              sort: `${sort},${direction}`,
            },
            { emitEvent: false },
          );
          return this.catalog
            .products({
              search: params.get('search'),
              categoryId: params.get('categoryId'),
              page: Number(params.get('page')) || 0,
              size: 12,
              sort,
              direction,
            })
            .pipe(
              catchError((e) => {
                this.error.set(errorMessage(e));
                return of(null);
              }),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.result.set(page);
        this.loading.set(false);
      });
  }

  protected apply() {
    const { search, categoryId, sort } = this.form.getRawValue();
    const [field, direction] = sort.split(',');
    this.navigate({
      search: search.trim() || null,
      categoryId: categoryId || null,
      sort: field,
      direction,
      page: null,
    });
  }

  protected goToPage(page: number) {
    this.navigate({ page });
  }

  protected reset() {
    this.router.navigate([], { relativeTo: this.route });
  }

  private navigate(queryParams: Params) {
    this.router.navigate([], { relativeTo: this.route, queryParams, queryParamsHandling: 'merge' });
  }
}
