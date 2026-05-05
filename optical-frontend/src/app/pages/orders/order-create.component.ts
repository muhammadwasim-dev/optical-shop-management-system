import {
  ChangeDetectionStrategy, Component, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl
} from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { HttpClient } from '@angular/common/http';
import { OrderService } from './order.service';
import { PrescriptionType } from './order.model';

interface CustomerOption { id: string; name: string; contact: string; }

@Component({
  selector: 'app-order-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, InputNumberModule,
    SelectButtonModule, AutoCompleteModule, ToastModule,
  ],
  providers: [MessageService],
  styleUrl: './order-create.component.scss',
  template: `
    <p-toast />

    <div class="create-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">New Order</h1>
          <p class="page-subtitle">Create an order with prescription</p>
        </div>
        <p-button label="Back to Orders" icon="pi pi-arrow-left" severity="secondary" [text]="true" routerLink="/orders" />
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>

        <!-- Section 1: Customer -->
        <div class="form-section">
          <h2 class="section-title">
            <span class="section-number">1</span>
            Customer
          </h2>
          <div class="section-body">
            <div class="field">
              <label class="field-label">Customer <span class="field-required" aria-hidden="true">*</span></label>
              <p-autoComplete
                formControlName="customerSearch"
                [suggestions]="customerSuggestions()"
                field="name"
                placeholder="Search by name or contact…"
                (completeMethod)="searchCustomers($event)"
                (onSelect)="onCustomerSelect($event)"
                [minLength]="1"
                class="w-full"
                inputStyleClass="w-full"
                appendTo="body"
              >
                <ng-template let-c pTemplate="item">
                  <div class="customer-suggestion">
                    <span class="customer-name">{{ c.name }}</span>
                    <span class="customer-contact">{{ c.contact }}</span>
                  </div>
                </ng-template>
              </p-autoComplete>
              @if (form.get('customerId')?.invalid && submitted()) {
                <small class="field-error">Please select a customer</small>
              }
            </div>
          </div>
        </div>

        <!-- Section 2: Prescription -->
        <div class="form-section" formGroupName="prescription">
          <h2 class="section-title">
            <span class="section-number">2</span>
            Prescription
          </h2>
          <div class="section-body">
            <!-- Type selector -->
            <div class="field">
              <label class="field-label">Type</label>
              <p-selectButton
                formControlName="type"
                [options]="rxTypes"
                optionLabel="label"
                optionValue="value"
              />
            </div>

            <!-- 2-column prescription grid -->
            <div class="rx-grid">
              <div class="rx-eye-col">
                <h3 class="rx-eye-label">Right Eye (OD)</h3>
                <div class="rx-fields">
                  <div class="rx-field">
                    <label class="rx-label">SPH</label>
                    <p-inputNumber formControlName="rightSph" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-20" [max]="20" placeholder="0.00" inputStyleClass="rx-input" />
                  </div>
                  <div class="rx-field">
                    <label class="rx-label">CYL</label>
                    <p-inputNumber formControlName="rightCyl" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-6" [max]="6" placeholder="0.00" inputStyleClass="rx-input" />
                  </div>
                  <div class="rx-field">
                    <label class="rx-label">AXIS</label>
                    <p-inputNumber formControlName="rightAxis" [step]="1" [min]="1" [max]="180" [useGrouping]="false" placeholder="—" inputStyleClass="rx-input" />
                  </div>
                  <div class="rx-field">
                    <label class="rx-label">ADD</label>
                    <p-inputNumber formControlName="rightAdd" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" [max]="4" placeholder="—" inputStyleClass="rx-input" />
                  </div>
                </div>
              </div>
              <div class="rx-divider" aria-hidden="true"></div>
              <div class="rx-eye-col">
                <h3 class="rx-eye-label">Left Eye (OS)</h3>
                <div class="rx-fields">
                  <div class="rx-field">
                    <label class="rx-label">SPH</label>
                    <p-inputNumber formControlName="leftSph" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-20" [max]="20" placeholder="0.00" inputStyleClass="rx-input" />
                  </div>
                  <div class="rx-field">
                    <label class="rx-label">CYL</label>
                    <p-inputNumber formControlName="leftCyl" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-6" [max]="6" placeholder="0.00" inputStyleClass="rx-input" />
                  </div>
                  <div class="rx-field">
                    <label class="rx-label">AXIS</label>
                    <p-inputNumber formControlName="leftAxis" [step]="1" [min]="1" [max]="180" [useGrouping]="false" placeholder="—" inputStyleClass="rx-input" />
                  </div>
                  <div class="rx-field">
                    <label class="rx-label">ADD</label>
                    <p-inputNumber formControlName="leftAdd" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" [max]="4" placeholder="—" inputStyleClass="rx-input" />
                  </div>
                </div>
              </div>
            </div>

            <!-- PD below the grid -->
            <div class="field pd-field">
              <label class="field-label">PD (mm) <span class="field-required" aria-hidden="true">*</span></label>
              <p-inputNumber
                formControlName="pd"
                [min]="50" [max]="80" [step]="1"
                [useGrouping]="false"
                placeholder="64"
                inputStyleClass="pd-input"
              />
              @if (form.get('prescription.pd')?.invalid && submitted()) {
                <small class="field-error">PD is required (50–80 mm)</small>
              }
            </div>

            <div class="field">
              <label class="field-label">Written by</label>
              <input pInputText formControlName="writtenBy" placeholder="Optometrist name" class="w-full" />
            </div>
          </div>
        </div>

        <!-- Section 3: Frame & Lens -->
        <div class="form-section">
          <h2 class="section-title">
            <span class="section-number">3</span>
            Frame &amp; Lens
          </h2>
          <div class="section-body">
            <div class="field">
              <label class="field-label">Frame description <span class="field-required" aria-hidden="true">*</span></label>
              <input pInputText formControlName="frameDescription" placeholder="e.g. Black metal frame, model XX-2034, size 52-18-140" class="w-full" maxlength="500" />
              @if (form.get('frameDescription')?.invalid && submitted()) {
                <small class="field-error">Frame description is required</small>
              }
            </div>
            <div class="field">
              <label class="field-label">Lens type <span class="field-required" aria-hidden="true">*</span></label>
              <input pInputText formControlName="lensType" placeholder="e.g. Single Vision CR-39" class="w-full" maxlength="200" />
              @if (form.get('lensType')?.invalid && submitted()) {
                <small class="field-error">Lens type is required</small>
              }
            </div>
            <div class="field">
              <label class="field-label">Coatings</label>
              <input pInputText formControlName="coatings" placeholder="e.g. Anti-reflective, blue-light filter" class="w-full" maxlength="200" />
            </div>
          </div>
        </div>

        <!-- Section 4: Total -->
        <div class="form-section">
          <h2 class="section-title">
            <span class="section-number">4</span>
            Total Amount
          </h2>
          <div class="section-body">
            <div class="field">
              <label class="field-label">Total (Rs.) <span class="field-required" aria-hidden="true">*</span></label>
              <div class="money-input-wrap">
                <span class="money-prefix">Rs.</span>
                <p-inputNumber
                  formControlName="totalAmount"
                  [min]="0"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  placeholder="0.00"
                  inputStyleClass="money-input"
                />
              </div>
              @if (form.get('totalAmount')?.invalid && submitted()) {
                <small class="field-error">Total amount is required</small>
              }
            </div>
          </div>
        </div>

        <!-- Submit bar -->
        <div class="form-actions">
          <p-button
            type="button"
            label="Cancel"
            severity="secondary"
            [text]="true"
            routerLink="/orders"
          />
          <p-button
            type="submit"
            label="Create Order"
            icon="pi pi-check"
            [loading]="saving()"
          />
        </div>

      </form>
    </div>
  `,
})
export class OrderCreateComponent {
  private fb = inject(FormBuilder);
  private orderService = inject(OrderService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(MessageService);

  saving = signal(false);
  submitted = signal(false);
  customerSuggestions = signal<CustomerOption[]>([]);

  readonly rxTypes = [
    { label: 'Distance', value: 'DISTANCE' },
    { label: 'Near', value: 'NEAR' },
    { label: 'Bifocal', value: 'BIFOCAL' },
    { label: 'Progressive', value: 'PROGRESSIVE' },
  ];

  form: FormGroup = this.fb.group({
    customerSearch: [null],
    customerId: ['', Validators.required],
    prescription: this.fb.group({
      rightSph: [null],
      rightCyl: [null],
      rightAxis: [null],
      rightAdd: [null],
      leftSph: [null],
      leftCyl: [null],
      leftAxis: [null],
      leftAdd: [null],
      pd: [null, [Validators.required, Validators.min(50), Validators.max(80)]],
      type: ['DISTANCE', Validators.required],
      writtenBy: [''],
    }),
    frameDescription: ['', [Validators.required, Validators.maxLength(500)]],
    lensType: ['', [Validators.required, Validators.maxLength(200)]],
    coatings: [''],
    totalAmount: [null, Validators.required],
  });

  searchCustomers(event: { query: string }) {
    this.http.get<any[]>(`http://localhost:3000/customers?search=${encodeURIComponent(event.query)}`)
      .subscribe(customers => this.customerSuggestions.set(customers));
  }

  onCustomerSelect(event: any) {
    const customer: CustomerOption = event.value ?? event;
    this.form.patchValue({ customerId: customer.id });
  }

  submit() {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.value;
    const rx = v.prescription;

    const payload = {
      customerId: v.customerId,
      prescription: {
        type: rx.type as PrescriptionType,
        pd: rx.pd,
        ...(rx.writtenBy && { writtenBy: rx.writtenBy }),
        ...(rx.rightSph !== null && { rightSph: rx.rightSph }),
        ...(rx.rightCyl !== null && { rightCyl: rx.rightCyl }),
        ...(rx.rightAxis !== null && { rightAxis: rx.rightAxis }),
        ...(rx.rightAdd !== null && { rightAdd: rx.rightAdd }),
        ...(rx.leftSph !== null && { leftSph: rx.leftSph }),
        ...(rx.leftCyl !== null && { leftCyl: rx.leftCyl }),
        ...(rx.leftAxis !== null && { leftAxis: rx.leftAxis }),
        ...(rx.leftAdd !== null && { leftAdd: rx.leftAdd }),
      },
      frameDescription: v.frameDescription,
      lensType: v.lensType,
      ...(v.coatings && { coatings: v.coatings }),
      totalAmount: v.totalAmount.toFixed(2),
    };

    this.saving.set(true);
    this.orderService.create(payload).subscribe({
      next: (order) => {
        this.toast.add({ severity: 'success', summary: 'Order created', detail: `Order ${order.orderNumber} created.` });
        this.router.navigate(['/orders', order.id]);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Failed to create order.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: Array.isArray(msg) ? msg.join('. ') : msg });
        this.saving.set(false);
      },
    });
  }
}
