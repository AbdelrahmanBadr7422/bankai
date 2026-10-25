import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Category, Page, Product } from '../shared/models/api.models';
import { toParams } from './http-utils';

export interface ProductQuery {
  search?: string | null;
  categoryId?: string | number | null;
  page?: number;
  size?: number;
  sort?: string | null;
  direction?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  products(query: ProductQuery) {
    return this.http.get<Page<Product>>(`${this.api}/products`, { params: toParams(query) });
  }

  product(id: number) {
    return this.http.get<Product>(`${this.api}/products/${id}`);
  }

  categories() {
    return this.http.get<Category[]>(`${this.api}/categories`);
  }
}
