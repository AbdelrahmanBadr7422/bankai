import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  Category,
  CategoryRequest,
  Dashboard,
  Order,
  OrderStatus,
  OrderSummary,
  Page,
  Product,
  ProductRequest,
  User,
} from '../shared/models/api.models';
import { toParams } from './http-utils';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/admin`;

  dashboard() {
    return this.http.get<Dashboard>(`${this.url}/dashboard`);
  }

  products(search: string, page: number, size = 20) {
    return this.http.get<Page<Product>>(`${this.url}/products`, {
      params: toParams({ search, page, size }),
    });
  }
  product(id: number) {
    return this.http.get<Product>(`${this.url}/products/${id}`);
  }
  createProduct(body: ProductRequest) {
    return this.http.post<Product>(`${this.url}/products`, body);
  }
  updateProduct(id: number, body: ProductRequest) {
    return this.http.put<Product>(`${this.url}/products/${id}`, body);
  }
  deleteProduct(id: number) {
    return this.http.delete<void>(`${this.url}/products/${id}`);
  }

  categories() {
    return this.http.get<Category[]>(`${this.url}/categories`);
  }
  createCategory(body: CategoryRequest) {
    return this.http.post<Category>(`${this.url}/categories`, body);
  }
  updateCategory(id: number, body: CategoryRequest) {
    return this.http.put<Category>(`${this.url}/categories/${id}`, body);
  }
  deleteCategory(id: number) {
    return this.http.delete<void>(`${this.url}/categories/${id}`);
  }

  orders(status: string, page: number, size = 20) {
    return this.http.get<Page<OrderSummary>>(`${this.url}/orders`, {
      params: toParams({ status, page, size }),
    });
  }
  order(id: number) {
    return this.http.get<Order>(`${this.url}/orders/${id}`);
  }
  updateOrderStatus(id: number, status: OrderStatus) {
    return this.http.patch<Order>(`${this.url}/orders/${id}/status`, { status });
  }

  customers(page: number, size = 20) {
    return this.http.get<Page<User>>(`${this.url}/customers`, { params: toParams({ page, size }) });
  }
}
