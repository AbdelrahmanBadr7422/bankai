import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Address, AddressRequest } from '../shared/models/api.models';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/addresses`;

  list() {
    return this.http.get<Address[]>(this.url);
  }
  create(body: AddressRequest) {
    return this.http.post<Address>(this.url, body);
  }
  update(id: number, body: AddressRequest) {
    return this.http.put<Address>(`${this.url}/${id}`, body);
  }
  remove(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
