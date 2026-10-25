import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cart } from '../shared/models/api.models';

const EMPTY_CART: Cart = {
  items: [],
  totalQuantity: 0,
  subtotal: 0,
  estimatedShippingFee: 0,
  total: 0,
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/cart`;

  readonly cart = signal<Cart | null>(null);
  readonly count = computed(() => this.cart()?.totalQuantity ?? 0);

  load() {
    return this.http.get<Cart>(this.url).pipe(tap((c) => this.cart.set(c)));
  }

  add(productId: number, quantity: number) {
    return this.http
      .post<Cart>(`${this.url}/items`, { productId, quantity })
      .pipe(tap((c) => this.cart.set(c)));
  }

  update(productId: number, quantity: number) {
    return this.http
      .put<Cart>(`${this.url}/items/${productId}`, { quantity })
      .pipe(tap((c) => this.cart.set(c)));
  }

  remove(productId: number) {
    return this.http
      .delete<Cart>(`${this.url}/items/${productId}`)
      .pipe(tap((c) => this.cart.set(c)));
  }

  clear() {
    return this.http.delete<void>(this.url).pipe(tap(() => this.cart.set(EMPTY_CART)));
  }

  reset() {
    this.cart.set(null);
  }
}
