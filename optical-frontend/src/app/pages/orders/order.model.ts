export type OrderStatus = 'CREATED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY';
export type PrescriptionType = 'DISTANCE' | 'NEAR' | 'BIFOCAL' | 'PROGRESSIVE';

export interface Prescription {
  id: string;
  customerId: string;
  rightSph: string | null;
  rightCyl: string | null;
  rightAxis: number | null;
  rightAdd: string | null;
  leftSph: string | null;
  leftCyl: string | null;
  leftAxis: number | null;
  leftAdd: string | null;
  pd: number;
  type: PrescriptionType;
  writtenBy: string | null;
  writtenOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: string;
  paidOn: string;
  method: PaymentMethod;
  note: string | null;
  createdAt: string;
}

export interface OrderCustomer {
  id: string;
  name: string;
  contact: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: OrderCustomer;
  prescriptionId: string;
  prescription: Prescription;
  frameDescription: string;
  lensType: string;
  coatings: string | null;
  totalAmount: string;
  status: OrderStatus;
  payments: Payment[];
  totalPaid: string;
  balanceDue: string;
  isPaidInFull: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersPage {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateOrderPayload {
  customerId: string;
  prescription: {
    rightSph?: number;
    rightCyl?: number;
    rightAxis?: number;
    rightAdd?: number;
    leftSph?: number;
    leftCyl?: number;
    leftAxis?: number;
    leftAdd?: number;
    pd: number;
    type: PrescriptionType;
    writtenBy?: string;
    writtenOn?: string;
  };
  frameDescription: string;
  lensType: string;
  coatings?: string;
  totalAmount: string;
}

export interface RecordPaymentPayload {
  amount: string;
  method: PaymentMethod;
  paidOn?: string;
  note?: string;
}
