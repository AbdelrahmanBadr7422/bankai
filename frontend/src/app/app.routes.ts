import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    title: 'Bankai',
    loadComponent: () => import('./features/home/home-page').then((m) => m.HomePage),
  },
  {
    path: 'books',
    title: 'Books · Bankai',
    loadComponent: () => import('./features/products/catalog-page').then((m) => m.CatalogPage),
  },
  {
    path: 'books/:id',
    title: 'Book · Bankai',
    loadComponent: () =>
      import('./features/products/product-detail-page').then((m) => m.ProductDetailPage),
  },
  {
    path: 'login',
    title: 'Sign in · Bankai',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Register · Bankai',
    loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'cart',
    title: 'Cart · Bankai',
    canActivate: [authGuard],
    loadComponent: () => import('./features/cart/cart-page').then((m) => m.CartPage),
  },
  {
    path: 'addresses',
    title: 'Addresses · Bankai',
    canActivate: [authGuard],
    loadComponent: () => import('./features/addresses/addresses-page').then((m) => m.AddressesPage),
  },
  {
    path: 'checkout',
    title: 'Checkout · Bankai',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout-page').then((m) => m.CheckoutPage),
  },
  {
    path: 'orders',
    title: 'My orders · Bankai',
    canActivate: [authGuard],
    loadComponent: () => import('./features/orders/orders-page').then((m) => m.OrdersPage),
  },
  {
    path: 'orders/:id',
    title: 'Order · Bankai',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/order-detail-page').then((m) => m.OrderDetailPage),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      {
        path: '',
        title: 'Dashboard · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-dashboard-page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'products',
        title: 'Books · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-products-page').then((m) => m.AdminProductsPage),
      },
      {
        path: 'products/new',
        title: 'New book · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-product-form-page').then((m) => m.AdminProductFormPage),
      },
      {
        path: 'products/:id/edit',
        title: 'Edit book · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-product-form-page').then((m) => m.AdminProductFormPage),
      },
      {
        path: 'categories',
        title: 'Categories · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-categories-page').then((m) => m.AdminCategoriesPage),
      },
      {
        path: 'orders',
        title: 'Orders · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-orders-page').then((m) => m.AdminOrdersPage),
      },
      {
        path: 'orders/:id',
        title: 'Order · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-order-detail-page').then((m) => m.AdminOrderDetailPage),
      },
      {
        path: 'customers',
        title: 'Customers · Bankai Admin',
        loadComponent: () =>
          import('./features/admin/admin-customers-page').then((m) => m.AdminCustomersPage),
      },
    ],
  },
  {
    path: '**',
    title: 'Not found · Bankai',
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
