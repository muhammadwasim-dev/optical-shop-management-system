import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { OrderStatus, OrdersPage, Order, CreateOrderPayload, RecordPaymentPayload, Payment } from './order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private api = 'http://localhost:3000/orders';

  constructor(private http: HttpClient) {}

  getAll(params?: { q?: string; status?: OrderStatus[]; page?: number; limit?: number }) {
    let httpParams = new HttpParams();
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.status?.length) {
      params.status.forEach(s => { httpParams = httpParams.append('status', s); });
    }
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<OrdersPage>(this.api, { params: httpParams });
  }

  getOne(id: string) {
    return this.http.get<Order>(`${this.api}/${id}`);
  }

  create(payload: CreateOrderPayload) {
    return this.http.post<Order>(this.api, payload);
  }

  update(id: string, payload: Partial<{
    frameDescription: string;
    lensType: string;
    coatings: string;
    totalAmount: string;
    prescription: {
      type?: string;
      pd?: number;
      rightSph?: number | null;
      rightCyl?: number | null;
      rightAxis?: number | null;
      rightAdd?: number | null;
      leftSph?: number | null;
      leftCyl?: number | null;
      leftAxis?: number | null;
      leftAdd?: number | null;
      writtenBy?: string;
    };
  }>) {
    return this.http.patch<Order>(`${this.api}/${id}`, payload);
  }

  updateStatus(id: string, status: OrderStatus) {
    return this.http.patch<Order>(`${this.api}/${id}/status`, { status });
  }

  remove(id: string) {
    return this.http.delete(`${this.api}/${id}`);
  }

  recordPayment(orderId: string, payload: RecordPaymentPayload) {
    return this.http.post<Payment>(`${this.api}/${orderId}/payments`, payload);
  }

  deletePayment(orderId: string, paymentId: string) {
    return this.http.delete(`${this.api}/${orderId}/payments/${paymentId}`);
  }
}
