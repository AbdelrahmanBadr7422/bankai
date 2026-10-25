import { Component, inject, OnInit, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AddressService } from '../../core/address.service';
import { errorMessage } from '../../core/errors';
import { textControl } from '../../core/forms';
import { NotifyService } from '../../core/notify.service';
import { Address } from '../../shared/models/api.models';
import { Field } from '../../shared/field';

@Component({
  selector: 'app-addresses-page',
  imports: [ReactiveFormsModule, Field],
  template: `
    <div class="page">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="page-title">Shipping addresses</h1>
          <div class="rule"></div>
        </div>
        @if (!showForm()) {
          <button type="button" class="btn btn-primary" (click)="startNew()">Add address</button>
        }
      </div>

      @if (error()) {
        <div class="alert-error mt-6" role="alert">{{ error() }}</div>
      }

      @if (showForm()) {
        <form
          [formGroup]="form"
          (ngSubmit)="save()"
          class="panel mt-6 grid gap-4 sm:grid-cols-2"
          novalidate
        >
          <h2 class="text-xl font-bold sm:col-span-2">
            {{ editingId() === null ? 'New address' : 'Edit address' }}
          </h2>
          @if (formError()) {
            <div class="alert-error sm:col-span-2" role="alert">{{ formError() }}</div>
          }
          <app-field label="Recipient name" [control]="form.controls.recipientName"
            ><input class="input" formControlName="recipientName"
          /></app-field>
          <app-field label="Phone" [control]="form.controls.phone"
            ><input class="input" type="tel" formControlName="phone"
          /></app-field>
          <app-field label="Address line 1" [control]="form.controls.line1"
            ><input class="input" formControlName="line1"
          /></app-field>
          <app-field label="Address line 2 (optional)" [control]="form.controls.line2"
            ><input class="input" formControlName="line2"
          /></app-field>
          <app-field label="City" [control]="form.controls.city"
            ><input class="input" formControlName="city"
          /></app-field>
          <app-field label="Postal code" [control]="form.controls.postalCode"
            ><input class="input" formControlName="postalCode"
          /></app-field>
          <app-field label="Country" [control]="form.controls.country"
            ><input class="input" formControlName="country"
          /></app-field>
          <div class="flex gap-3 sm:col-span-2">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Saving…' : 'Save address' }}
            </button>
            <button type="button" class="btn btn-outline" (click)="cancel()">Cancel</button>
          </div>
        </form>
      }

      @if (loading()) {
        <p class="mt-8 text-muted">Loading addresses…</p>
      } @else if (addresses().length === 0 && !showForm()) {
        <div class="panel mt-8">
          <p>You have no saved addresses. Add one to be able to check out.</p>
        </div>
      } @else {
        <ul class="mt-8 grid gap-4 sm:grid-cols-2">
          @for (a of addresses(); track a.id) {
            <li class="panel text-sm">
              <address class="not-italic leading-relaxed">
                <strong>{{ a.recipientName }}</strong
                ><br />
                {{ a.line1 }}<br />
                @if (a.line2) {
                  {{ a.line2 }}<br />
                }
                {{ a.city }} {{ a.postalCode }}<br />{{ a.country }}<br />{{ a.phone }}
              </address>
              <div class="mt-4 flex gap-2">
                <button type="button" class="btn btn-outline btn-sm" (click)="startEdit(a)">
                  Edit
                </button>
                <button type="button" class="btn btn-danger btn-sm" (click)="remove(a)">
                  Delete
                </button>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class AddressesPage implements OnInit {
  private api = inject(AddressService);
  private notify = inject(NotifyService);

  protected addresses = signal<Address[]>([]);
  protected loading = signal(true);
  protected error = signal('');
  protected showForm = signal(false);
  protected editingId = signal<number | null>(null);
  protected saving = signal(false);
  protected formError = signal('');
  protected form = new FormGroup({
    recipientName: textControl(Validators.required, Validators.maxLength(120)),
    phone: textControl(Validators.required, Validators.maxLength(30)),
    line1: textControl(Validators.required, Validators.maxLength(255)),
    line2: textControl(Validators.maxLength(255)),
    city: textControl(Validators.required, Validators.maxLength(100)),
    postalCode: textControl(Validators.required, Validators.maxLength(20)),
    country: textControl(Validators.required, Validators.maxLength(100)),
  });

  ngOnInit() {
    this.load();
  }

  private load() {
    this.api.list().subscribe({
      next: (list) => {
        this.addresses.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  protected startNew() {
    this.form.reset();
    this.editingId.set(null);
    this.formError.set('');
    this.showForm.set(true);
  }

  protected startEdit(a: Address) {
    this.form.setValue({
      recipientName: a.recipientName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? '',
      city: a.city,
      postalCode: a.postalCode,
      country: a.country,
    });
    this.editingId.set(a.id);
    this.formError.set('');
    this.showForm.set(true);
  }

  protected cancel() {
    this.showForm.set(false);
  }

  protected save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body = { ...v, line2: v.line2.trim() || null };
    const id = this.editingId();
    this.saving.set(true);
    this.formError.set('');
    const request = id === null ? this.api.create(body) : this.api.update(id, body);
    request.subscribe({
      next: () => {
        this.notify.success('Address saved');
        this.saving.set(false);
        this.showForm.set(false);
        this.load();
      },
      error: (e) => {
        this.formError.set(errorMessage(e));
        this.saving.set(false);
      },
    });
  }

  protected async remove(a: Address) {
    if (
      !(await this.notify.confirm(
        `Delete the address for ${a.recipientName} (${a.line1})?`,
        'Delete',
      ))
    )
      return;
    this.api.remove(a.id).subscribe({
      next: () => {
        this.notify.success('Address deleted');
        this.load();
      },
      error: (e) => this.notify.error(errorMessage(e)),
    });
  }
}
