import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../core/admin.service';
import { errorMessage } from '../../core/errors';
import { textControl } from '../../core/forms';
import { NotifyService } from '../../core/notify.service';
import { Category } from '../../shared/models/api.models';
import { Field } from '../../shared/field';

@Component({
  selector: 'app-admin-categories-page',
  imports: [ReactiveFormsModule, Field],
  template: `
    <h1 class="page-title">Categories</h1>
    <div class="rule"></div>

    <form
      [formGroup]="form"
      (ngSubmit)="save()"
      class="panel mt-6 grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-start"
      novalidate
    >
      @if (formError()) {
        <div class="alert-error sm:col-span-3" role="alert">{{ formError() }}</div>
      }
      <app-field label="Name" [control]="form.controls.name"
        ><input class="input" formControlName="name"
      /></app-field>
      <app-field label="Description (optional)" [control]="form.controls.description"
        ><input class="input" formControlName="description"
      /></app-field>
      <div class="flex gap-2 sm:mt-5">
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ editingId() === null ? 'Add' : 'Update' }}
        </button>
        @if (editingId() !== null) {
          <button type="button" class="btn btn-outline" (click)="resetForm()">Cancel</button>
        }
      </div>
    </form>

    @if (error()) {
      <div class="alert-error mt-6" role="alert">{{ error() }}</div>
    }

    @if (loading()) {
      <p class="mt-8 text-muted">Loading categories…</p>
    } @else if (categories().length === 0) {
      <div class="panel mt-6"><p>No categories yet. Add the first one above.</p></div>
    } @else {
      <div class="panel mt-6 overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of categories(); track c.id) {
              <tr>
                <td class="font-semibold">{{ c.name }}</td>
                <td>{{ c.description }}</td>
                <td class="whitespace-nowrap text-right">
                  <button type="button" class="btn btn-outline btn-sm" (click)="edit(c)">
                    Edit
                  </button>
                  <button type="button" class="btn btn-danger btn-sm ml-1" (click)="remove(c)">
                    Delete
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminCategoriesPage implements OnInit {
  private admin = inject(AdminService);
  private notify = inject(NotifyService);

  protected categories = signal<Category[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);
  protected formError = signal('');
  protected form = new FormGroup({
    name: textControl(Validators.required, Validators.maxLength(100)),
    description: textControl(Validators.maxLength(500)),
  });

  ngOnInit() {
    this.load();
  }

  private load() {
    this.admin.categories().subscribe({
      next: (list) => {
        this.categories.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected edit(c: Category) {
    this.editingId.set(c.id);
    this.formError.set('');
    this.form.setValue({ name: c.name, description: c.description ?? '' });
  }

  protected resetForm() {
    this.editingId.set(null);
    this.formError.set('');
    this.form.reset();
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = { name: v.name.trim(), description: v.description.trim() || null };
    const id = this.editingId();
    this.saving.set(true);
    this.formError.set('');
    const request =
      id === null ? this.admin.createCategory(body) : this.admin.updateCategory(id, body);
    request.subscribe({
      next: () => {
        this.notify.success('Category saved');
        this.saving.set(false);
        this.resetForm();
        this.load();
      },
      error: (e) => {
        this.formError.set(errorMessage(e));
        this.saving.set(false);
      },
    });
  }

  protected async remove(c: Category) {
    if (!(await this.notify.confirm(`Delete the category "${c.name}"?`, 'Delete'))) return;
    this.admin.deleteCategory(c.id).subscribe({
      next: () => {
        this.notify.success('Category deleted');
        this.load();
      },
      error: (e) => this.notify.error(errorMessage(e)),
    });
  }
}
