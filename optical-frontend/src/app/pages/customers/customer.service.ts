import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Customer } from './customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly api = 'http://localhost:3000/customers';

  constructor(private http: HttpClient) {}

  getAll(search?: string) {
    const params = search ? new HttpParams().set('search', search) : undefined;
    return this.http.get<Customer[]>(this.api, { params });
  }

  getOne(id: string) {
    return this.http.get<Customer>(`${this.api}/${id}`);
  }

  create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.http.post<Customer>(this.api, data);
  }

  update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>) {
    return this.http.patch<Customer>(`${this.api}/${id}`, data);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
