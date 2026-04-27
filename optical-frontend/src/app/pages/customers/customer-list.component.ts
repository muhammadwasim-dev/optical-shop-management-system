import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CustomerService } from './customer.service';
import { Customer } from './customer.model';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  styles: [`
    /* ── Page ───────────────────────────────────────────── */
    .customers-page {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    /* Page header */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .page-subtitle {
      margin: var(--space-1) 0 0;
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    /* Table card */
    .table-card {
      background: var(--color-surface-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-base);
      overflow: hidden;
    }

    /* Toolbar */
    .table-toolbar {
      display: flex;
      align-items: center;
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--color-border-subtle);
      background: var(--color-surface-card);
    }

    .search-wrapper {
      position: relative;
      width: 100%;
      max-width: 320px;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
      font-size: var(--font-size-sm);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding-left: 2.25rem !important;
    }

    /* Table row */
    .table-row {
      cursor: pointer;
    }

    /* Actions cell */
    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-1);
      white-space: nowrap;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16) var(--space-8);
      text-align: center;
      gap: var(--space-3);
    }

    .empty-icon {
      font-size: 2.5rem;
      color: var(--color-text-muted);
      margin-bottom: var(--space-2);
    }

    .empty-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
    }

    .empty-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      margin: 0;
    }

    /* Dialog form fields */
    .dialog-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .dialog-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .field-required {
      color: var(--color-error);
    }

    .field-error {
      font-size: var(--font-size-xs);
      color: var(--color-error);
      margin: 0;
    }
  `],
  template: `
    <p-toast />
    <p-confirmDialog header="Confirm Delete" />

    <div class="customers-page">

      <!-- Page header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customers</h1>
          <p class="page-subtitle">Manage your customer records</p>
        </div>
        <p-button label="Add Customer" icon="pi pi-plus" (onClick)="openAdd()" />
      </div>

      <!-- Table card -->
      <div class="table-card">

        <!-- Toolbar: search -->
        <div class="table-toolbar">
          <span class="search-wrapper">
            <i class="pi pi-search search-icon" aria-hidden="true"></i>
            <input
              pInputText
              type="text"
              placeholder="Search by name or contact…"
              class="search-input"
              [value]="searchValue"
              (input)="onSearch($event)"
              aria-label="Search customers"
            />
          </span>
        </div>

        <!-- Table -->
        <p-table [value]="customers" [loading]="loading" stripedRows>
          <ng-template #header>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Contact</th>
              <th scope="col">Address</th>
              <th scope="col">Added</th>
              <th scope="col"><span class="sr-only">Actions</span></th>
            </tr>
          </ng-template>

          <ng-template #body let-customer>
            <tr class="table-row" (click)="openEdit(customer)">
              <td>{{ customer.name }}</td>
              <td>{{ customer.contact }}</td>
              <td>{{ customer.address || '—' }}</td>
              <td>{{ customer.createdAt | date:'mediumDate' }}</td>
              <td class="actions-cell" (click)="$event.stopPropagation()">
                <p-button
                  icon="pi pi-pencil"
                  severity="secondary"
                  [text]="true"
                  size="small"
                  [attr.aria-label]="'Edit ' + customer.name"
                  (onClick)="openEdit(customer)"
                />
                @if (auth.isOwner()) {
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    size="small"
                    [attr.aria-label]="'Delete ' + customer.name"
                    (onClick)="confirmDelete(customer)"
                  />
                }
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="5" style="padding:0;border:none;">
                <div class="empty-state">
                  <i class="pi pi-users empty-icon" aria-hidden="true"></i>
                  <p class="empty-title">No customers found</p>
                  <p class="empty-subtitle">
                    {{ searchValue ? 'Try a different search term.' : 'Add your first customer to get started.' }}
                  </p>
                  @if (!searchValue) {
                    <p-button label="Add Customer" icon="pi pi-plus" size="small" (onClick)="openAdd()" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

      </div>
    </div>

    <!-- Add / Edit Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editingId ? 'Edit Customer' : 'Add Customer'"
      [modal]="true"
      [style]="{ width: '450px' }"
      (onHide)="resetForm()"
    >
      <form [formGroup]="form" class="flex flex-column gap-4 mt-2">

        <div class="dialog-field">
          <label class="dialog-label">Name <span class="field-required" aria-hidden="true">*</span></label>
          <input pInputText formControlName="name" placeholder="Full name" class="w-full" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <small class="field-error">Name is required</small>
          }
        </div>

        <div class="dialog-field">
          <label class="dialog-label">Contact <span class="field-required" aria-hidden="true">*</span></label>
          <input pInputText formControlName="contact" placeholder="Phone number" class="w-full" />
          @if (form.get('contact')?.invalid && form.get('contact')?.touched) {
            <small class="field-error">Contact is required</small>
          }
        </div>

        <div class="dialog-field">
          <label class="dialog-label">Address</label>
          <input pInputText formControlName="address" placeholder="Optional" class="w-full" />
        </div>

      </form>

      <ng-template #footer>
        <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="dialogVisible = false" />
        <p-button [label]="editingId ? 'Save' : 'Add'" (onClick)="submit()" [loading]="saving" />
      </ng-template>
    </p-dialog>
  `,
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  saving = false;
  dialogVisible = false;
  editingId: string | null = null;
  searchValue = '';
  form: FormGroup;

  private search$ = new Subject<string>();

  constructor(
    private customerService: CustomerService,
    public auth: AuthService,
    private confirmation: ConfirmationService,
    private toast: MessageService,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      contact: ['', Validators.required],
      address: [''],
    });
  }

  ngOnInit() {
    this.loadCustomers();
    this.search$.pipe(debounceTime(300), distinctUntilChanged()).subscribe(term => {
      this.loadCustomers(term);
    });
  }

  loadCustomers(search?: string) {
    this.loading = true;
    this.customerService.getAll(search || undefined).subscribe({
      next: (data) => { this.customers = data; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.searchValue = term;
    this.search$.next(term);
  }

  openAdd() {
    this.editingId = null;
    this.form.reset();
    this.dialogVisible = true;
  }

  openEdit(customer: Customer) {
    this.editingId = customer.id;
    this.form.patchValue({
      name: customer.name,
      contact: customer.contact,
      address: customer.address ?? '',
    });
    this.dialogVisible = true;
  }

  resetForm() {
    this.editingId = null;
    this.form.reset();
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const value = this.form.value;
    this.saving = true;

    const op$ = this.editingId
      ? this.customerService.update(this.editingId, value)
      : this.customerService.create(value);

    op$.subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Saved', detail: 'Customer saved successfully.' });
        this.dialogVisible = false;
        this.saving = false;
        this.loadCustomers(this.searchValue || undefined);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save customer.' });
        this.saving = false;
      },
    });
  }

  confirmDelete(customer: Customer) {
    this.confirmation.confirm({
      message: `Delete "${customer.name}"? This cannot be undone.`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteCustomer(customer.id),
    });
  }

  deleteCustomer(id: string) {
    this.customerService.remove(id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: 'Customer removed.' });
        this.loadCustomers(this.searchValue || undefined);
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete customer.' });
      },
    });
  }
}
