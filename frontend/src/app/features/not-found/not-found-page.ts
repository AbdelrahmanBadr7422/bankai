import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <div class="page text-center">
      <p class="font-display text-8xl font-bold text-blood">404</p>
      <h1 class="page-title mt-2">Page not found</h1>
      <p class="mt-2 text-muted">The page you are looking for does not exist.</p>
      <a routerLink="/" class="btn btn-dark mt-6">Back to the shop</a>
    </div>
  `,
})
export class NotFoundPage {}
