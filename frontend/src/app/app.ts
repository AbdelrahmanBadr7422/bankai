import { Component, HostListener, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CartService } from './core/cart.service';
import { NotifyService } from './core/notify.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-paper focus:p-2"
      >Skip to content</a
    >

    <header class="bg-ink text-paper">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <a routerLink="/" class="flex items-baseline gap-3">
          <span class="font-display text-2xl font-bold tracking-[0.25em]">BANKAI</span>
          <span class="text-sm text-blood" aria-hidden="true">卍解</span>
        </a>
        <button
          type="button"
          class="btn btn-sm border-paper/40 text-paper md:hidden"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="main-nav"
          (click)="menuOpen.set(!menuOpen())"
        >
          Menu
        </button>
        <nav
          id="main-nav"
          aria-label="Main"
          class="w-full flex-col gap-3 md:flex md:w-auto md:flex-row md:items-center md:gap-6"
          [class.hidden]="!menuOpen()"
          [class.flex]="menuOpen()"
          (click)="menuOpen.set(false)"
        >
          <a routerLink="/books" routerLinkActive="nav-link-active" class="nav-link">Books</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/orders" routerLinkActive="nav-link-active" class="nav-link">Orders</a>
            <a routerLink="/addresses" routerLinkActive="nav-link-active" class="nav-link"
              >Addresses</a
            >
            @if (auth.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="nav-link-active" class="nav-link">Admin</a>
            }
            <a routerLink="/cart" routerLinkActive="nav-link-active" class="nav-link"
              >Cart ({{ cart.count() }})</a
            >
            <span class="text-sm text-paper/60">{{ auth.user()?.fullName }}</span>
            <button
              type="button"
              class="btn btn-sm border-paper/40 text-paper hover:bg-paper/10"
              (click)="auth.logout()"
            >
              Sign out
            </button>
          } @else {
            <a routerLink="/login" routerLinkActive="nav-link-active" class="nav-link">Sign in</a>
            <a routerLink="/register" class="btn btn-primary btn-sm">Register</a>
          }
        </nav>
      </div>
    </header>

    <main id="main" class="min-h-[60vh]"><router-outlet /></main>

    <footer class="mt-16 bg-ink py-8 text-center text-sm text-paper/60">
      <p>
        <span class="text-blood" aria-hidden="true">本屋</span> · Bankai is a portfolio project, not
        a real shop. Payment is cash on delivery only.
      </p>
    </footer>

    <div
      class="fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
      aria-live="polite"
    >
      @for (t of notify.toasts(); track t.id) {
        <div
          class="flex items-start justify-between gap-3 border-l-4 bg-ink px-4 py-3 text-sm text-paper shadow-lg"
          [class.border-blood]="t.kind === 'error'"
          [class.border-emerald-500]="t.kind === 'success'"
        >
          <span>{{ t.text }}</span>
          <button
            type="button"
            class="text-paper/60 hover:text-paper"
            aria-label="Dismiss"
            (click)="notify.dismiss(t.id)"
          >
            ✕
          </button>
        </div>
      }
    </div>

    @if (notify.dialog(); as d) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-text"
          class="w-full max-w-sm bg-paper p-6"
        >
          <p id="confirm-text" class="mb-6 text-sm">{{ d.message }}</p>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn btn-outline" (click)="notify.answer(false)">
              Go back
            </button>
            <button type="button" class="btn btn-danger" autofocus (click)="notify.answer(true)">
              {{ d.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class App {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected notify = inject(NotifyService);
  protected menuOpen = signal(false);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.cart.load().subscribe({ error: () => undefined });
      } else {
        this.cart.reset();
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape() {
    if (this.notify.dialog()) this.notify.answer(false);
  }
}
