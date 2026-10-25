import { Component, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { textControl } from '../../core/forms';
import { NotifyService } from '../../core/notify.service';
import { Field } from '../../shared/field';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, Field],
  template: `
    <div class="page">
      <div class="mx-auto max-w-md">
        <h1 class="page-title">Create an account</h1>
        <div class="rule"></div>
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 space-y-4" novalidate>
          @if (error()) {
            <div class="alert-error" role="alert">{{ error() }}</div>
          }
          <app-field label="Full name" [control]="form.controls.fullName">
            <input class="input" formControlName="fullName" autocomplete="name" />
          </app-field>
          <app-field label="Email" [control]="form.controls.email">
            <input class="input" type="email" formControlName="email" autocomplete="email" />
          </app-field>
          <app-field label="Phone (optional)" [control]="form.controls.phone">
            <input class="input" type="tel" formControlName="phone" autocomplete="tel" />
          </app-field>
          <app-field label="Password (8 to 72 characters)" [control]="form.controls.password">
            <input
              class="input"
              type="password"
              formControlName="password"
              autocomplete="new-password"
            />
          </app-field>
          <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
            {{ loading() ? 'Creating account…' : 'Register' }}
          </button>
        </form>
        <p class="mt-6 text-sm text-muted">
          Already registered? <a routerLink="/login" class="text-blood underline">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotifyService);

  protected loading = signal(false);
  protected error = signal('');
  protected form = new FormGroup({
    fullName: textControl(Validators.required, Validators.maxLength(120)),
    email: textControl(Validators.required, Validators.email, Validators.maxLength(255)),
    phone: textControl(Validators.maxLength(30)),
    password: textControl(Validators.required, Validators.minLength(8), Validators.maxLength(72)),
  });

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const v = this.form.getRawValue();
    this.auth
      .register({ ...v, fullName: v.fullName.trim(), phone: v.phone.trim() || null })
      .subscribe({
        next: () => {
          this.notify.success('Account created. Welcome to Bankai!');
          this.router.navigateByUrl('/');
        },
        error: (e) => {
          this.error.set(errorMessage(e));
          this.loading.set(false);
        },
      });
  }
}
