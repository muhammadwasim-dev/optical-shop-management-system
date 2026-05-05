import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { OrderService } from './order.service';
import { Order, OrderStatus, Payment, PrescriptionType } from './order.model';
import { AuthService } from '../../core/auth/auth.service';

const STATUS_ORDER: OrderStatus[] = ['CREATED', 'IN_PROGRESS', 'READY', 'DELIVERED'];

function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_ORDER.indexOf(current);
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule,
    InputNumberModule, SelectModule, SelectButtonModule, ToastModule,
  ],
  providers: [MessageService],
  styleUrl: './order-detail.component.scss',
  template: `
    <p-toast />

    @if (loading()) {
      <div class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size:2rem; color:var(--color-primary-500);" aria-label="Loading order…"></i>
      </div>
    } @else if (order()) {
      <div class="detail-page">

        <!-- ── Header ── -->
        <div class="order-header">
          <div class="header-left">
            <a class="back-link" routerLink="/orders">
              <i class="pi pi-arrow-left" aria-hidden="true"></i>
              Orders
            </a>
            <div class="order-meta">
              <span class="order-number">{{ order()!.orderNumber }}</span>
              <span class="status-badge" [attr.data-status]="order()!.status">
                {{ statusLabel(order()!.status) }}
              </span>
            </div>
            <p class="order-date">Created {{ order()!.createdAt | date:'longDate' }}</p>
          </div>

          <div class="header-right">
            <!-- Page-level action zone -->
            <div class="page-actions">
              @if (isEditing()) {
                <span class="editing-badge" aria-live="polite">
                  <i class="pi pi-pencil" aria-hidden="true"></i>
                  Editing
                </span>
                <p-button
                  label="Save"
                  icon="pi pi-check"
                  (onClick)="saveEdit()"
                  [loading]="savingEdit()"
                  [disabled]="editForm.invalid"
                  aria-label="Save order changes"
                />
                <p-button
                  label="Cancel"
                  severity="secondary"
                  [text]="true"
                  (onClick)="cancelEdit()"
                  [disabled]="savingEdit()"
                  aria-label="Cancel editing"
                />
              } @else {
                <p-button
                  label="Edit"
                  icon="pi pi-pencil"
                  severity="secondary"
                  [outlined]="true"
                  (onClick)="startEdit()"
                  [disabled]="updatingStatus()"
                  aria-label="Edit this order"
                />
              }
            </div>

            <!-- Status & delete controls — disabled while editing -->
            <div class="header-status-actions">
              @if (auth.isOwner()) {
                <p-select
                  [options]="allStatusOptions"
                  [ngModel]="selectedStatus()"
                  (ngModelChange)="changeStatus($event)"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Change status"
                  [style]="{ width: '180px' }"
                  [disabled]="isEditing()"
                />
              } @else if (getNextStatus()) {
                <p-button
                  [label]="'Mark as ' + statusLabel(getNextStatus()!)"
                  icon="pi pi-arrow-right"
                  (onClick)="changeStatus(getNextStatus()!)"
                  [loading]="updatingStatus()"
                  [disabled]="isEditing()"
                />
              }
              @if (auth.isOwner()) {
                <p-button
                  icon="pi pi-trash"
                  severity="danger"
                  [text]="true"
                  [attr.aria-label]="'Delete order ' + order()!.orderNumber"
                  (onClick)="deleteOrder()"
                  [disabled]="isEditing()"
                />
              }
            </div>
          </div>
        </div>

        <div class="detail-grid">

          <!-- ── Left column ── -->
          <div class="detail-main">

            <!-- Customer (always read-only) -->
            <div class="detail-card">
              <h2 class="card-title">
                <i class="pi pi-user card-icon" aria-hidden="true"></i>
                Customer
              </h2>
              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">Name</span>
                  <span class="info-value">{{ order()!.customer.name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Contact</span>
                  <span class="info-value mono-text">{{ order()!.customer.contact }}</span>
                </div>
              </div>
            </div>

            <!-- Prescription -->
            <div class="detail-card" [class.editing-card]="isEditing()">
              <h2 class="card-title">
                <i class="pi pi-eye card-icon" aria-hidden="true"></i>
                Prescription
                <span class="rx-type-badge">{{ order()!.prescription.type }}</span>
              </h2>

              @if (isEditing()) {
                <div class="card-body" [formGroup]="editRxGroup">

                  <!-- Type -->
                  <div class="edit-field-column">
                    <span class="info-label">Type</span>
                    <p-selectButton
                      formControlName="type"
                      [options]="rxTypes"
                      optionLabel="label"
                      optionValue="value"
                    />
                  </div>

                  <!-- 2-column eye grid -->
                  <div class="rx-edit-grid">
                    <div class="rx-eye-col">
                      <h3 class="rx-eye-label">Right Eye (OD)</h3>
                      <div class="rx-fields">
                        <div class="rx-field">
                          <label class="rx-label">SPH</label>
                          <p-inputNumber formControlName="rightSph" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-20" [max]="20" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                        <div class="rx-field">
                          <label class="rx-label">CYL</label>
                          <p-inputNumber formControlName="rightCyl" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-6" [max]="6" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                        <div class="rx-field">
                          <label class="rx-label">AXIS</label>
                          <p-inputNumber formControlName="rightAxis" [step]="1" [min]="1" [max]="180" [useGrouping]="false" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                        <div class="rx-field">
                          <label class="rx-label">ADD</label>
                          <p-inputNumber formControlName="rightAdd" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" [max]="4" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                      </div>
                    </div>
                    <div class="rx-edit-divider" aria-hidden="true"></div>
                    <div class="rx-eye-col">
                      <h3 class="rx-eye-label">Left Eye (OS)</h3>
                      <div class="rx-fields">
                        <div class="rx-field">
                          <label class="rx-label">SPH</label>
                          <p-inputNumber formControlName="leftSph" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-20" [max]="20" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                        <div class="rx-field">
                          <label class="rx-label">CYL</label>
                          <p-inputNumber formControlName="leftCyl" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="-6" [max]="6" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                        <div class="rx-field">
                          <label class="rx-label">AXIS</label>
                          <p-inputNumber formControlName="leftAxis" [step]="1" [min]="1" [max]="180" [useGrouping]="false" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                        <div class="rx-field">
                          <label class="rx-label">ADD</label>
                          <p-inputNumber formControlName="leftAdd" [step]="0.25" [minFractionDigits]="2" [maxFractionDigits]="2" [min]="0" [max]="4" placeholder="—" inputStyleClass="rx-edit-input" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- PD -->
                  <div class="edit-field-column pd-field">
                    <label class="info-label" for="edit-pd">PD (mm) <span class="field-required" aria-hidden="true">*</span></label>
                    <p-inputNumber id="edit-pd" formControlName="pd" [min]="50" [max]="80" [step]="1" [useGrouping]="false" placeholder="64" inputStyleClass="pd-edit-input" />
                    @if (editRxGroup.get('pd')?.invalid && editRxGroup.get('pd')?.touched) {
                      <small class="field-error">PD must be between 50 and 80 mm</small>
                    }
                  </div>

                  <!-- Written by -->
                  <div class="edit-field">
                    <label class="info-label" for="edit-written-by">Written by</label>
                    <input id="edit-written-by" pInputText formControlName="writtenBy" class="edit-input" placeholder="Optometrist name" />
                  </div>

                </div>
              } @else {
                <div class="card-body">
                  <div class="rx-grid-display" role="table" aria-label="Prescription values">
                    <div class="rx-header-row" role="row">
                      <div class="rx-cell rx-row-label" role="columnheader"></div>
                      <div class="rx-cell rx-col-label" role="columnheader">SPH</div>
                      <div class="rx-cell rx-col-label" role="columnheader">CYL</div>
                      <div class="rx-cell rx-col-label" role="columnheader">AXIS</div>
                      <div class="rx-cell rx-col-label" role="columnheader">ADD</div>
                    </div>
                    <div class="rx-data-row" role="row">
                      <div class="rx-cell rx-row-label" role="rowheader">OD (R)</div>
                      <div class="rx-cell rx-value" role="cell">{{ fmtRx(order()!.prescription.rightSph) }}</div>
                      <div class="rx-cell rx-value" role="cell">{{ fmtRx(order()!.prescription.rightCyl) }}</div>
                      <div class="rx-cell rx-value" role="cell">{{ order()!.prescription.rightAxis ?? '—' }}</div>
                      <div class="rx-cell rx-value" role="cell">{{ fmtRx(order()!.prescription.rightAdd) }}</div>
                    </div>
                    <div class="rx-data-row" role="row">
                      <div class="rx-cell rx-row-label" role="rowheader">OS (L)</div>
                      <div class="rx-cell rx-value" role="cell">{{ fmtRx(order()!.prescription.leftSph) }}</div>
                      <div class="rx-cell rx-value" role="cell">{{ fmtRx(order()!.prescription.leftCyl) }}</div>
                      <div class="rx-cell rx-value" role="cell">{{ order()!.prescription.leftAxis ?? '—' }}</div>
                      <div class="rx-cell rx-value" role="cell">{{ fmtRx(order()!.prescription.leftAdd) }}</div>
                    </div>
                  </div>
                  <div class="info-row">
                    <span class="info-label">PD</span>
                    <span class="info-value mono-text">{{ order()!.prescription.pd }} mm</span>
                  </div>
                  @if (order()!.prescription.writtenBy) {
                    <div class="info-row">
                      <span class="info-label">Written by</span>
                      <span class="info-value">{{ order()!.prescription.writtenBy }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Frame & Lens -->
            <div class="detail-card" [class.editing-card]="isEditing()">
              <h2 class="card-title">
                <i class="pi pi-shopping-bag card-icon" aria-hidden="true"></i>
                Frame &amp; Lens
              </h2>
              @if (isEditing()) {
                <div class="card-body" [formGroup]="editForm">
                  <div class="edit-field">
                    <label class="info-label" for="edit-frame">Frame</label>
                    <input id="edit-frame" pInputText formControlName="frameDescription" class="edit-input" placeholder="Frame description" />
                    @if (editForm.get('frameDescription')?.invalid && editForm.get('frameDescription')?.touched) {
                      <small class="field-error">Frame description is required</small>
                    }
                  </div>
                  <div class="edit-field">
                    <label class="info-label" for="edit-lens">Lens type</label>
                    <input id="edit-lens" pInputText formControlName="lensType" class="edit-input" placeholder="Lens type" />
                    @if (editForm.get('lensType')?.invalid && editForm.get('lensType')?.touched) {
                      <small class="field-error">Lens type is required</small>
                    }
                  </div>
                  <div class="edit-field">
                    <label class="info-label" for="edit-coatings">Coatings</label>
                    <input id="edit-coatings" pInputText formControlName="coatings" class="edit-input" placeholder="Optional" />
                  </div>
                </div>
              } @else {
                <div class="card-body">
                  <div class="info-row">
                    <span class="info-label">Frame</span>
                    <span class="info-value">{{ order()!.frameDescription }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Lens type</span>
                    <span class="info-value">{{ order()!.lensType }}</span>
                  </div>
                  @if (order()!.coatings) {
                    <div class="info-row">
                      <span class="info-label">Coatings</span>
                      <span class="info-value">{{ order()!.coatings }}</span>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          <!-- ── Right column ── -->
          <div class="detail-aside">

            <!-- Totals -->
            <div class="detail-card totals-card" [class.editing-card]="isEditing()">
              <h2 class="card-title">
                <i class="pi pi-wallet card-icon" aria-hidden="true"></i>
                Payment Summary
              </h2>
              <div class="card-body">
                <div class="totals-row">
                  <span class="totals-label">Total</span>
                  @if (isEditing()) {
                    <div class="money-input-wrap">
                      <span class="money-prefix">Rs.</span>
                      <p-inputNumber
                        [formControl]="totalAmountCtrl"
                        [min]="0"
                        [minFractionDigits]="2"
                        [maxFractionDigits]="2"
                        placeholder="0.00"
                        inputStyleClass="money-input"
                        aria-label="Total amount"
                      />
                    </div>
                  } @else {
                    <span class="totals-value money">Rs.&nbsp;{{ formatMoney(order()!.totalAmount) }}</span>
                  }
                </div>
                @if (isEditing() && totalAmountCtrl.invalid && totalAmountCtrl.touched) {
                  <small class="field-error">Total amount must be 0 or greater</small>
                }
                <div class="totals-row">
                  <span class="totals-label">Paid</span>
                  <span class="totals-value money paid-text">Rs.&nbsp;{{ formatMoney(order()!.totalPaid) }}</span>
                </div>
                <div class="totals-divider"></div>
                <div class="totals-row balance-row">
                  <span class="totals-label">Balance due</span>
                  @if (order()!.isPaidInFull) {
                    <span class="paid-badge">
                      <i class="pi pi-check-circle" aria-hidden="true"></i>
                      Paid in full
                    </span>
                  } @else {
                    <span class="totals-value money balance-text">Rs.&nbsp;{{ formatMoney(order()!.balanceDue) }}</span>
                  }
                </div>
              </div>
            </div>

            <!-- Payment history -->
            <div class="detail-card">
              <div class="card-title-row">
                <h2 class="card-title">
                  <i class="pi pi-history card-icon" aria-hidden="true"></i>
                  Payments
                </h2>
                <p-button
                  label="Record"
                  icon="pi pi-plus"
                  size="small"
                  [text]="true"
                  [disabled]="isEditing()"
                  (onClick)="paymentDialogVisible.set(true)"
                  aria-label="Record a payment"
                />
              </div>
              <div class="card-body">
                @if (order()!.payments.length === 0) {
                  <p class="no-payments">No payments recorded yet.</p>
                } @else {
                  @for (payment of order()!.payments; track payment.id) {
                    <div class="payment-row">
                      <div class="payment-info">
                        <span class="payment-amount money">Rs.&nbsp;{{ formatMoney(payment.amount) }}</span>
                        <span class="payment-meta">
                          <span class="payment-method">{{ payment.method }}</span>
                          &middot;
                          <span class="payment-date mono-text">{{ payment.paidOn | date:'mediumDate' }}</span>
                        </span>
                        @if (payment.note) {
                          <span class="payment-note">{{ payment.note }}</span>
                        }
                      </div>
                      @if (auth.isOwner()) {
                        <p-button
                          icon="pi pi-times"
                          severity="danger"
                          [text]="true"
                          size="small"
                          [attr.aria-label]="'Delete payment of Rs. ' + formatMoney(payment.amount)"
                          (onClick)="deletePayment(payment)"
                        />
                      }
                    </div>
                  }
                }
              </div>
            </div>

          </div>
        </div>
      </div>
    } @else {
      <div class="not-found">
        <p>Order not found.</p>
        <p-button label="Back to Orders" icon="pi pi-arrow-left" routerLink="/orders" />
      </div>
    }

    <!-- ── Record Payment Dialog ── -->
    <p-dialog
      [(visible)]="paymentDialogVisible"
      [modal]="true"
      [style]="{ width: '420px' }"
      ariaLabelledBy="payment-dialog-title"
      (onHide)="resetPaymentForm()"
    >
      <ng-template #header>
        <span id="payment-dialog-title" class="p-dialog-title">Record Payment</span>
      </ng-template>

      <form [formGroup]="paymentForm" class="payment-form">
        <div class="field">
          <label class="field-label">Amount (Rs.) <span class="field-required" aria-hidden="true">*</span></label>
          <div class="money-input-wrap">
            <span class="money-prefix">Rs.</span>
            <p-inputNumber
              formControlName="amount"
              [min]="0.01"
              [minFractionDigits]="2"
              [maxFractionDigits]="2"
              placeholder="0.00"
              inputStyleClass="money-input"
            />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Method <span class="field-required" aria-hidden="true">*</span></label>
          <p-select
            formControlName="method"
            [options]="paymentMethods"
            optionLabel="label"
            optionValue="value"
            placeholder="Select method"
            class="w-full"
          />
        </div>
        <div class="field">
          <label class="field-label">Note</label>
          <input pInputText formControlName="note" placeholder="e.g. Advance, Balance" class="w-full" />
        </div>
      </form>

      <ng-template #footer>
        <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="paymentDialogVisible.set(false)" />
        <p-button label="Record Payment" icon="pi pi-check" (onClick)="recordPayment()" [loading]="savingPayment()" />
      </ng-template>
    </p-dialog>
  `,
})
export class OrderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  public auth = inject(AuthService);
  private toast = inject(MessageService);
  private fb = inject(FormBuilder);

  order = signal<Order | null>(null);
  loading = signal(true);
  updatingStatus = signal(false);
  paymentDialogVisible = signal(false);
  savingPayment = signal(false);
  selectedStatus = signal<OrderStatus>('CREATED');
  isEditing = signal(false);
  savingEdit = signal(false);

  private orderId = toSignal(
    this.route.params.pipe(map(p => p['id'] as string)),
    { initialValue: '' }
  );

  readonly allStatusOptions = [
    { label: 'Created', value: 'CREATED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Ready', value: 'READY' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  readonly paymentMethods = [
    { label: 'Cash', value: 'CASH' },
    { label: 'Card', value: 'CARD' },
    { label: 'Mobile Money', value: 'MOBILE_MONEY' },
  ];

  readonly rxTypes = [
    { label: 'Distance', value: 'DISTANCE' },
    { label: 'Near', value: 'NEAR' },
    { label: 'Bifocal', value: 'BIFOCAL' },
    { label: 'Progressive', value: 'PROGRESSIVE' },
  ];

  editForm: FormGroup = this.fb.group({
    frameDescription: ['', [Validators.required, Validators.maxLength(500)]],
    lensType: ['', [Validators.required, Validators.maxLength(200)]],
    coatings: ['', [Validators.maxLength(200)]],
    totalAmount: [0, [Validators.required, Validators.min(0)]],
    prescription: this.fb.group({
      type: ['DISTANCE', Validators.required],
      pd: [null, [Validators.required, Validators.min(50), Validators.max(80)]],
      rightSph: [null],
      rightCyl: [null],
      rightAxis: [null],
      rightAdd: [null],
      leftSph: [null],
      leftCyl: [null],
      leftAxis: [null],
      leftAdd: [null],
      writtenBy: [''],
    }),
  });

  get editRxGroup(): FormGroup {
    return this.editForm.get('prescription') as FormGroup;
  }

  get totalAmountCtrl(): FormControl {
    return this.editForm.controls['totalAmount'] as FormControl;
  }

  paymentForm: FormGroup = this.fb.group({
    amount: [null, Validators.required],
    method: ['CASH', Validators.required],
    note: [''],
  });

  ngOnInit() { this.loadOrder(); }

  private loadOrder() {
    this.loading.set(true);
    this.orderService.getOne(this.orderId()).subscribe({
      next: (o) => {
        this.order.set(o);
        this.selectedStatus.set(o.status);
        this.loading.set(false);
      },
      error: () => { this.order.set(null); this.loading.set(false); },
    });
  }

  startEdit() {
    const o = this.order();
    if (!o) return;
    const rx = o.prescription;
    this.editForm.reset({
      frameDescription: o.frameDescription,
      lensType: o.lensType,
      coatings: o.coatings ?? '',
      totalAmount: parseFloat(o.totalAmount),
      prescription: {
        type: rx.type,
        pd: rx.pd,
        rightSph: rx.rightSph !== null ? parseFloat(rx.rightSph as string) : null,
        rightCyl: rx.rightCyl !== null ? parseFloat(rx.rightCyl as string) : null,
        rightAxis: rx.rightAxis,
        rightAdd: rx.rightAdd !== null ? parseFloat(rx.rightAdd as string) : null,
        leftSph: rx.leftSph !== null ? parseFloat(rx.leftSph as string) : null,
        leftCyl: rx.leftCyl !== null ? parseFloat(rx.leftCyl as string) : null,
        leftAxis: rx.leftAxis,
        leftAdd: rx.leftAdd !== null ? parseFloat(rx.leftAdd as string) : null,
        writtenBy: rx.writtenBy ?? '',
      },
    });
    this.isEditing.set(true);
  }

  saveEdit() {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;
    const o = this.order();
    if (!o) return;
    const v = this.editForm.value;
    const rx = v.prescription;

    const payload = {
      frameDescription: v.frameDescription as string,
      lensType: v.lensType as string,
      coatings: v.coatings as string,
      totalAmount: (v.totalAmount as number).toFixed(2),
      prescription: {
        type: rx.type as PrescriptionType,
        pd: rx.pd as number,
        ...(rx.rightSph !== null && { rightSph: rx.rightSph as number }),
        ...(rx.rightCyl !== null && { rightCyl: rx.rightCyl as number }),
        ...(rx.rightAxis !== null && { rightAxis: rx.rightAxis as number }),
        ...(rx.rightAdd !== null && { rightAdd: rx.rightAdd as number }),
        ...(rx.leftSph !== null && { leftSph: rx.leftSph as number }),
        ...(rx.leftCyl !== null && { leftCyl: rx.leftCyl as number }),
        ...(rx.leftAxis !== null && { leftAxis: rx.leftAxis as number }),
        ...(rx.leftAdd !== null && { leftAdd: rx.leftAdd as number }),
        ...(rx.writtenBy && { writtenBy: rx.writtenBy as string }),
      },
    };

    this.savingEdit.set(true);
    this.orderService.update(o.id, payload).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.isEditing.set(false);
        this.savingEdit.set(false);
        this.toast.add({ severity: 'success', summary: 'Saved', detail: 'Order updated.' });
      },
      error: (err) => {
        this.savingEdit.set(false);
        const msg = err?.error?.message ?? 'Failed to save changes.';
        this.toast.add({ severity: 'error', summary: 'Error', detail: Array.isArray(msg) ? msg.join('. ') : msg });
      },
    });
  }

  cancelEdit() {
    this.editForm.reset();
    this.isEditing.set(false);
  }

  statusLabel(s: OrderStatus): string {
    return { CREATED: 'Created', IN_PROGRESS: 'In Progress', READY: 'Ready', DELIVERED: 'Delivered' }[s];
  }

  getNextStatus(): OrderStatus | null {
    const o = this.order();
    return o ? nextStatus(o.status) : null;
  }

  formatMoney(val: string): string {
    return parseFloat(val).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  fmtRx(val: string | null): string {
    if (val === null || val === undefined) return '—';
    const n = parseFloat(val);
    return (n >= 0 ? '+' : '') + n.toFixed(2);
  }

  changeStatus(newStatus: OrderStatus) {
    const o = this.order();
    if (!o || newStatus === o.status) return;
    this.updatingStatus.set(true);
    this.orderService.updateStatus(o.id, newStatus).subscribe({
      next: (updated) => {
        this.order.set(updated);
        this.selectedStatus.set(updated.status);
        this.updatingStatus.set(false);
        this.toast.add({ severity: 'success', summary: 'Updated', detail: `Order moved to ${this.statusLabel(newStatus)}.` });
      },
      error: (err) => {
        this.updatingStatus.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Failed to update status.' });
      },
    });
  }

  deleteOrder() {
    const o = this.order();
    if (!o || !confirm(`Delete order ${o.orderNumber}? This cannot be undone.`)) return;
    this.orderService.remove(o.id).subscribe({
      next: () => this.router.navigate(['/orders']),
      error: () => this.toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete order.' }),
    });
  }

  recordPayment() {
    this.paymentForm.markAllAsTouched();
    if (this.paymentForm.invalid) return;
    const o = this.order();
    if (!o) return;
    const v = this.paymentForm.value;
    this.savingPayment.set(true);
    this.orderService.recordPayment(o.id, {
      amount: (v.amount as number).toFixed(2),
      method: v.method,
      ...(v.note && { note: v.note }),
    }).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Recorded', detail: 'Payment recorded.' });
        this.paymentDialogVisible.set(false);
        this.savingPayment.set(false);
        this.resetPaymentForm();
        this.loadOrder();
      },
      error: (err) => {
        this.savingPayment.set(false);
        this.toast.add({ severity: 'error', summary: 'Error', detail: err?.error?.message ?? 'Failed to record payment.' });
      },
    });
  }

  resetPaymentForm() { this.paymentForm.reset({ method: 'CASH' }); }

  deletePayment(payment: Payment) {
    const o = this.order();
    if (!o || !confirm('Delete this payment? This cannot be undone.')) return;
    this.orderService.deletePayment(o.id, payment.id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Deleted', detail: 'Payment removed.' });
        this.loadOrder();
      },
      error: () => this.toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete payment.' }),
    });
  }
}
