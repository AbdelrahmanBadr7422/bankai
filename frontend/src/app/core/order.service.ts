import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Order, OrderSummary, Page } from '../shared/models/api.models';
import { toParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/orders`;

  checkout(addressId: number) {
    return this.http.post<Order>(`${this.url}/checkout`, { addressId, paymentMethod: 'COD' });
  }

  list(page: number, size = 10) {
    return this.http.get<Page<OrderSummary>>(this.url, { params: toParams({ page, size }) });
  }

  get(id: number) {
    return this.http.get<Order>(`${this.url}/${id}`);
  }
  cancel(id: number) {
    return this.http.post<Order>(`${this.url}/${id}/cancel`, {});
  }
}
