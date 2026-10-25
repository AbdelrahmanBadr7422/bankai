import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/errors';
import { textControl } from '../../core/forms';
import { NotifyService } from '../../core/notify.service';
import { Category } from '../../shared/models/api.models';
import { Field } from '../../shared/field';

@Component({
  selector: 'app-admin-product-form-page',
  imports: [ReactiveFormsModule, RouterLink, Field],
  template: `
    <a routerLink="/admin/products" class="text-sm text-muted hover:text-blood">← All books</a>
    <h1 class="page-title mt-4">{{ id ? 'Edit book' : 'New book' }}</h1>
    <div class="rule"></div>

    @if (loading()) {
      <p class="mt-8 text-muted">Loading…</p>
    } @else if (categories().length === 0) {
      <div class="panel mt-8">
        <p>You need at least one category before adding a book.</p>
        <a routerLink="/admin/categories" class="btn btn-primary mt-4">Create a category</a>
      </div>
    } @else {
      <form
        [formGroup]="form"
        (ngSubmit)="save()"
        class="panel mt-8 grid gap-4 sm:grid-cols-2"
        novalidate
      >
        @if (error()) {
          <div class="alert-error sm:col-span-2" role="alert">{{ error() }}</div>
        }
        <div class="sm:col-span-2">
          <app-field label="Title" [control]="form.controls.title"
            ><input class="input" formControlName="title"
          /></app-field>
        </div>
        <app-field label="Author" [control]="form.controls.author"
          ><input class="input" formControlName="author"
        /></app-field>
        <app-field
          label="ISBN (10 to 17 characters: digits, X, hyphens)"
          [control]="form.controls.isbn"
          ><input class="input" formControlName="isbn"
        /></app-field>
        <app-field label="Price" [control]="form.controls.price"
          ><input class="input" type="number" step="0.01" min="0.01" formControlName="price"
        /></app-field>
        <app-field label="Stock quantity" [control]="form.controls.stockQuantity"
          ><input class="input" type="number" step="1" min="0" formControlName="stockQuantity"
        /></app-field>
        <app-field label="Category" [control]="form.controls.categoryId">
          <select class="input" formControlName="categoryId">
            <option value="">Select a category</option>
            @for (c of categories(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </app-field>
        <app-field label="Cover image URL (optional)" [control]="form.controls.coverImageUrl"
          ><input class="input" type="url" formControlName="coverImageUrl"
        /></app-field>
        <div class="sm:col-span-2">
          <app-field label="Description (optional)" [control]="form.controls.description">
            <textarea class="input" rows="5" formControlName="description"></textarea>
          </app-field>
        </div>
        <label class="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" class="accent-blood" formControlName="active" /> Active (visible in
          the public catalogue)
        </label>
        <div class="flex gap-3 sm:col-span-2">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save book' }}
          </button>
          <a routerLink="/admin/products" class="btn btn-outline">Cancel</a>
        </div>
      </form>
    }
  `,
})
export class AdminProductFormPage {
  private admin = inject(AdminService);
  private router = inject(Router);
  private notify = inject(NotifyService);

  protected id = inject(ActivatedRoute).snapshot.paramMap.get('id');
  protected categories = signal<Category[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected error = signal('');
  protected form = new FormGroup({
    title: textControl(Validators.required, Validators.maxLength(255)),
    author: textControl(Validators.required, Validators.maxLength(255)),
    isbn: textControl(Validators.required, Validators.pattern(/^[0-9Xx-]{10,17}$/)),
    price: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    stockQuantity: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    categoryId: textControl(Validators.required),
    coverImageUrl: textControl(Validators.maxLength(500)),
    description: textControl(Validators.maxLength(4000)),
    active: new FormControl(true, { nonNullable: true }),
  });

  constructor() {
    forkJoin({
      categories: this.admin.categories(),
      product: this.id ? this.admin.product(Number(this.id)) : of(null),
    }).subscribe({
      next: ({ categories, product }) => {
        this.categories.set(categories);
        if (product) {
          this.form.setValue({
            title: product.title,
            author: product.author,
            isbn: product.isbn,
            price: product.price,
            stockQuantity: product.stockQuantity,
            categoryId: String(product.categoryId),
            coverImageUrl: product.coverImageUrl ?? '',
            description: product.description ?? '',
            active: product.active,
          });
        }
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      author: v.author.trim(),
      isbn: v.isbn.trim(),
      price: Number(v.price),
      stockQuantity: Number(v.stockQuantity),
      coverImageUrl: v.coverImageUrl.trim() || null,
      categoryId: Number(v.categoryId),
      active: v.active,
    };
    this.saving.set(true);
    this.error.set('');
    const request = this.id
      ? this.admin.updateProduct(Number(this.id), body)
      : this.admin.createProduct(body);
    request.subscribe({
      next: () => {
        this.notify.success('Book saved');
        this.router.navigate(['/admin/products']);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
