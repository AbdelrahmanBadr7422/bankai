import { Component, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';
import { textControl } from '../../core/forms';
import { Field } from '../../shared/field';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, Field],
  template: `
    <div class="page">
      <div class="mx-auto max-w-md">
        <h1 class="page-title">Sign in</h1>
        <div class="rule"></div>
        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 space-y-4" novalidate>
          @if (error()) {
            <div class="alert-error" role="alert">{{ error() }}</div>
          }
          <app-field label="Email" [control]="form.controls.email">
            <input class="input" type="email" formControlName="email" autocomplete="email" />
          </app-field>
          <app-field label="Password" [control]="form.controls.password">
            <input
              class="input"
              type="password"
              formControlName="password"
              autocomplete="current-password"
            />
          </app-field>
          <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <p class="mt-6 text-sm text-muted">
          New here? <a routerLink="/register" class="text-blood underline">Create an account</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  protected loading = signal(false);
  protected error = signal('');
  protected form = new FormGroup({
    email: textControl(Validators.required, Validators.email),
    password: textControl(Validators.required),
  });

  protected submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl()),
      error: (e) => {
        this.error.set(errorMessage(e));
        this.loading.set(false);
      },
    });
  }

  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }
}
