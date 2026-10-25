import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="page">
      <nav
        class="mb-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-ink/20 pb-2"
        aria-label="Admin"
      >
        @for (l of links; track l.path) {
          <a
            [routerLink]="l.path"
            routerLinkActive="tab-link-active"
            [routerLinkActiveOptions]="{ exact: l.exact }"
            class="tab-link"
            >{{ l.label }}</a
          >
        }
      </nav>
      <router-outlet />
    </div>
  `,
})
export class AdminLayout {
  protected links = [
    { path: '/admin', label: 'Dashboard', exact: true },
    { path: '/admin/products', label: 'Books', exact: false },
    { path: '/admin/categories', label: 'Categories', exact: false },
    { path: '/admin/orders', label: 'Orders', exact: false },
    { path: '/admin/customers', label: 'Customers', exact: false },
  ];
}
