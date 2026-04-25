import { Component, OnInit } from '@angular/core';
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
  template: `
    <p-toast />
    <p-confirmDialog />

    <div class="p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-semibold">Customers</h1>
        <p-button label="Add Customer" icon="pi pi-plus" (onClick)="openAdd()" />
      </div>

      <div class="mb-3">
        <input
          pInputText
          type="text"
          placeholder="Search by name or contact..."
          class="w-full md:w-1/3"
          [value]="searchValue"
          (input)="onSearch($event)"
        />
      </div>

      <p-table [value]="customers" [loading]="loading" stripedRows>
        <ng-template #header>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Created</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template #body let-customer>
          <tr class="cursor-pointer" (click)="openEdit(customer)">
            <td>{{ customer.name }}</td>
            <td>{{ customer.contact }}</td>
            <td>{{ customer.address || '—' }}</td>
            <td>{{ customer.createdAt | date:'mediumDate' }}</td>
            <td (click)="$event.stopPropagation()">
              @if (auth.isOwner()) {
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  (onClick)="confirmDelete(customer)"
                />
              }
            </td>
          </tr>
        </ng-template>
        <ng-template #emptymessage>
          <tr>
            <td colspan="5" class="text-center text-gray-500 py-6">No customers found.</td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Add / Edit Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editingId ? 'Edit Customer' : 'Add Customer'"
      [modal]="true"
      [style]="{ width: '450px' }"
      (onHide)="resetForm()"
    >
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        <div class="flex flex-col gap-1">
          <label class="font-medium">Name <span class="text-red-500">*</span></label>
          <input pInputText formControlName="name" placeholder="Full name" class="w-full" />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <small class="text-red-500">Name is required</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium">Contact <span class="text-red-500">*</span></label>
          <input pInputText formControlName="contact" placeholder="Phone number" class="w-full" />
          @if (form.get('contact')?.invalid && form.get('contact')?.touched) {
            <small class="text-red-500">Contact is required</small>
          }
        </div>

        <div class="flex flex-col gap-1">
          <label class="font-medium">Address</label>
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
