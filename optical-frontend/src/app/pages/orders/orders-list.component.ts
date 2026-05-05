import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal, computed
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { OrderService } from './order.service';
import { OrderStatus, Order } from './order.model';
import { AuthService } from '../../core/auth/auth.service';

const STATUS_LABELS: Record<OrderStatus, string> = {
  CREATED: 'Created',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready',
  DELIVERED: 'Delivered',
};

const STATUS_SEVERITY: Record<OrderStatus, string> = {
  CREATED: 'secondary',
  IN_PROGRESS: 'info',
  READY: 'warning',
  DELIVERED: 'success',
};

@Component({
  selector: 'app-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, FormsModule,
    TableModule, ButtonModule, InputTextModule, TagModule, ToastModule,
  ],
  providers: [MessageService, DatePipe],
  styleUrl: './orders-list.component.scss',
  template: `
    <p-toast />

    <div class="orders-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Orders</h1>
          <p class="page-subtitle">Track and manage all shop orders</p>
        </div>
        <p-button label="New Order" icon="pi pi-plus" routerLink="/orders/new" />
      </div>

      <!-- Table card -->
      <div class="table-card">
        <!-- Toolbar: search + status filter chips -->
        <div class="table-toolbar">
          <span class="search-wrapper">
            <i class="pi pi-search search-icon" aria-hidden="true"></i>
            <input
              pInputText
              type="text"
              placeholder="Search by order # or customer…"
              class="search-input"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              aria-label="Search orders"
            />
          </span>
          <div class="status-chips" role="group" aria-label="Filter by status">
            <button
              *ngFor="let s of allStatuses"
              class="status-chip"
              [class.active]="isStatusActive(s)"
              [attr.data-status]="s"
              (click)="toggleStatus(s)"
            >{{ statusLabel(s) }}</button>
          </div>
        </div>

        <!-- Table -->
        <p-table
          [value]="orders()"
          [loading]="loading()"
          [lazy]="true"
          [totalRecords]="totalRecords()"
          [rows]="pageSize"
          [paginator]="true"
          (onPage)="onPage($event)"
          stripedRows
          [tableStyle]="{ 'min-width': '800px' }"
        >
          <ng-template #header>
            <tr>
              <th scope="col">Order #</th>
              <th scope="col">Customer</th>
              <th scope="col">Status</th>
              <th scope="col" class="money-col">Total</th>
              <th scope="col" class="money-col">Balance</th>
              <th scope="col">Date</th>
              <th scope="col"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>

          <ng-template #body let-order>
            <tr class="table-row" [routerLink]="['/orders', order.id]" style="cursor:pointer">
              <td><span class="mono-text order-num">{{ order.orderNumber }}</span></td>
              <td>{{ order.customer.name }}</td>
              <td>
                <span class="status-badge" [attr.data-status]="order.status">
                  {{ statusLabel(order.status) }}
                </span>
              </td>
              <td class="money-col"><span class="money-value">Rs.&nbsp;{{ formatMoney(order.totalAmount) }}</span></td>
              <td class="money-col">
                <span class="money-value" [class.paid]="order.isPaidInFull" [class.outstanding]="!order.isPaidInFull">
                  @if (order.isPaidInFull) {
                    <i class="pi pi-check-circle" aria-hidden="true"></i>
                  } @else {
                    Rs.&nbsp;{{ formatMoney(order.balanceDue) }}
                  }
                </span>
              </td>
              <td><span class="mono-text">{{ order.createdAt | date:'mediumDate' }}</span></td>
              <td class="actions-cell" (click)="$event.stopPropagation()">
                <p-button
                  icon="pi pi-eye"
                  severity="secondary"
                  [text]="true"
                  size="small"
                  [routerLink]="['/orders', order.id]"
                  [attr.aria-label]="'View order ' + order.orderNumber"
                />
                @if (auth.isOwner()) {
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    size="small"
                    [attr.aria-label]="'Delete order ' + order.orderNumber"
                    (onClick)="deleteOrder(order)"
                  />
                }
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="7" style="padding:0;border:none;">
                <div class="empty-state">
                  <svg class="empty-illustration" viewBox="0 0 240 160" width="240" height="160"
                    xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                    <defs>
                      <linearGradient id="ord-grad" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stop-color="#6366f1"/>
                        <stop offset="50%" stop-color="#8b5cf6"/>
                        <stop offset="100%" stop-color="#d946ef"/>
                      </linearGradient>
                    </defs>
                    <!-- Receipt card -->
                    <rect x="40" y="12" width="120" height="136" rx="8" fill="none" stroke="url(#ord-grad)" stroke-width="2" opacity="0.6"/>
                    <rect x="40" y="12" width="120" height="28" rx="8" fill="url(#ord-grad)" opacity="0.12"/>
                    <rect x="40" y="28" width="120" height="12" fill="url(#ord-grad)" opacity="0.12"/>
                    <text x="60" y="35" font-size="11" font-weight="700" fill="url(#ord-grad)" opacity="0.9">ORDER</text>
                    <!-- Rx lines -->
                    <line x1="56" y1="56" x2="144" y2="56" stroke="url(#ord-grad)" stroke-width="1.5" opacity="0.4"/>
                    <line x1="56" y1="72" x2="130" y2="72" stroke="url(#ord-grad)" stroke-width="1.5" opacity="0.3"/>
                    <line x1="56" y1="88" x2="116" y2="88" stroke="url(#ord-grad)" stroke-width="1.5" opacity="0.22"/>
                    <line x1="56" y1="104" x2="100" y2="104" stroke="url(#ord-grad)" stroke-width="1.5" opacity="0.16"/>
                    <!-- Money total line -->
                    <line x1="56" y1="124" x2="144" y2="124" stroke="url(#ord-grad)" stroke-width="2" opacity="0.5"/>
                    <circle cx="195" cy="50" r="18" fill="none" stroke="url(#ord-grad)" stroke-width="2" opacity="0.55"/>
                    <text x="188" y="55" font-size="14" font-weight="700" fill="url(#ord-grad)" opacity="0.8">Rs</text>
                  </svg>
                  <p class="empty-title">
                    {{ searchQuery() || activeStatuses().length ? 'No orders found' : 'No orders yet' }}
                  </p>
                  <p class="empty-subtitle">
                    {{ searchQuery() || activeStatuses().length
                      ? 'Try adjusting your search or filters.'
                      : 'Create your first order to get started.' }}
                  </p>
                  @if (!searchQuery() && !activeStatuses().length) {
                    <p-button label="New Order" icon="pi pi-plus" size="small" routerLink="/orders/new" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
})
export class OrdersListComponent implements OnInit {
  private orderService = inject(OrderService);
  public auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(MessageService);

  readonly allStatuses: OrderStatus[] = ['CREATED', 'IN_PROGRESS', 'READY', 'DELIVERED'];
  readonly pageSize = 20;

  searchQuery = signal('');
  activeStatuses = signal<OrderStatus[]>([]);
  currentPage = signal(1);
  loading = signal(false);
  orders = signal<Order[]>([]);
  totalRecords = signal(0);

  private readonly searchQuery$ = toObservable(this.searchQuery);

  statusLabel(s: OrderStatus): string { return STATUS_LABELS[s]; }
  isStatusActive(s: OrderStatus): boolean { return this.activeStatuses().includes(s); }

  toggleStatus(s: OrderStatus) {
    this.activeStatuses.update(arr =>
      arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]
    );
    this.currentPage.set(1);
    this.loadOrders();
  }

  formatMoney(val: string): string {
    const num = parseFloat(val);
    return num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private loadOrders() {
    this.loading.set(true);
    this.orderService.getAll({
      q: this.searchQuery() || undefined,
      status: this.activeStatuses().length ? this.activeStatuses() : undefined,
      page: this.currentPage(),
      limit: this.pageSize,
    }).subscribe({
      next: (page) => {
        this.orders.set(page.items);
        this.totalRecords.set(page.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnInit() {
    this.loadOrders();
    this.searchQuery$.pipe(
      skip(1),
      debounceTime(300),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.currentPage.set(1);
      this.loadOrders();
    });
  }

  onPage(event: any) {
    this.currentPage.set((event.first / event.rows) + 1);
    this.loadOrders();
  }

  deleteOrder(order: Order) {
    if (!confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return;
    this.orderService.remove(order.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: `Order ${order.orderNumber} deleted.` });
        this.loadOrders();
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete order.' }),
    });
  }
}
