import { Component, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  styleUrl: './customer-list.component.scss',
  template: `
    <p-toast />
    <p-confirmDialog header="Confirm Delete" />

    <div class="customers-page">

      <!-- Step 7: Page header with gradient title (dark mode) -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Customers</h1>
          <p class="page-subtitle">Manage your customer records</p>
        </div>
        <p-button label="Add Customer" icon="pi pi-plus" (onClick)="openAdd()" />
      </div>

      <!-- Step 7: Table card with hover lift -->
      <div class="table-card">

        <!-- Toolbar: search — lens-aperture glow on focus via global CSS -->
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
            <!-- Step 7: row hover with left-edge gradient indicator -->
            <tr class="table-row" (click)="openEdit(customer)">
              <td>{{ customer.name }}</td>
              <td>{{ customer.contact }}</td>
              <td>{{ customer.address || '—' }}</td>
              <!-- Step 2: Geist Mono for date values -->
              <td><span class="mono-date">{{ customer.createdAt | date:'mediumDate' }}</span></td>
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

          <!-- Step 8: Illustrated empty state -->
          <ng-template #emptymessage>
            <tr>
              <td colspan="5" style="padding:0;border:none;">
                <div class="empty-state">

                  <!-- Hand-drawn 240×160 SVG — prescription card + magnifying glass -->
                  <svg
                    class="empty-illustration"
                    viewBox="0 0 240 160"
                    width="240"
                    height="160"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <defs>
                      <linearGradient id="rx-grad" x1="0" y1="0" x2="240" y2="160" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stop-color="#6366f1"/>
                        <stop offset="50%"  stop-color="#8b5cf6"/>
                        <stop offset="100%" stop-color="#d946ef"/>
                      </linearGradient>
                    </defs>

                    <!-- Prescription card body -->
                    <rect
                      x="16" y="16" width="148" height="108" rx="12"
                      fill="none"
                      stroke="url(#rx-grad)"
                      stroke-width="2"
                      opacity="0.6"
                    />

                    <!-- Card header bar -->
                    <rect
                      x="16" y="16" width="148" height="28" rx="12"
                      fill="url(#rx-grad)"
                      opacity="0.12"
                    />
                    <rect x="16" y="32" width="148" height="12" fill="url(#rx-grad)" opacity="0.12"/>

                    <!-- Rx label -->
                    <text
                      x="38" y="38"
                      font-size="14"
                      font-weight="700"
                      fill="url(#rx-grad)"
                      opacity="0.9"
                    >Rx</text>

                    <!-- Prescription data lines -->
                    <line x1="32" y1="62" x2="148" y2="62" stroke="url(#rx-grad)" stroke-width="1.5" opacity="0.35"/>
                    <line x1="32" y1="78" x2="130" y2="78" stroke="url(#rx-grad)" stroke-width="1.5" opacity="0.28"/>
                    <line x1="32" y1="94" x2="112" y2="94" stroke="url(#rx-grad)" stroke-width="1.5" opacity="0.20"/>
                    <line x1="32" y1="110" x2="95"  y2="110" stroke="url(#rx-grad)" stroke-width="1.5" opacity="0.14"/>

                    <!-- Column tick marks suggesting SPH / CYL / AXIS layout -->
                    <line x1="80" y1="55" x2="80" y2="120" stroke="url(#rx-grad)" stroke-width="0.75" opacity="0.18" stroke-dasharray="2 3"/>
                    <line x1="114" y1="55" x2="114" y2="120" stroke="url(#rx-grad)" stroke-width="0.75" opacity="0.18" stroke-dasharray="2 3"/>

                    <!-- Magnifying glass circle -->
                    <circle
                      cx="185" cy="68" r="36"
                      fill="none"
                      stroke="url(#rx-grad)"
                      stroke-width="2.5"
                      opacity="0.75"
                    />

                    <!-- Magnifying glass handle -->
                    <line
                      x1="210" y1="93" x2="228" y2="114"
                      stroke="url(#rx-grad)"
                      stroke-width="3.5"
                      stroke-linecap="round"
                      opacity="0.75"
                    />

                    <!-- Iris / eye inside the magnifying glass -->
                    <ellipse
                      cx="185" cy="68" rx="18" ry="11"
                      fill="none"
                      stroke="url(#rx-grad)"
                      stroke-width="1.5"
                      opacity="0.55"
                    />
                    <circle
                      cx="185" cy="68" r="5"
                      fill="url(#rx-grad)"
                      opacity="0.65"
                    />
                    <circle cx="183" cy="66" r="1.2" fill="white" opacity="0.55"/>
                  </svg>

                  <p class="empty-title">
                    {{ searchValue ? 'No results found' : 'No customers yet' }}
                  </p>
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
      [modal]="true"
      [style]="{ width: '450px' }"
      [header]="editingId ? 'Edit Customer' : 'Add Customer'"
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
    private cdr: ChangeDetectorRef,
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
      next: (data) => { this.customers = data; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); },
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
