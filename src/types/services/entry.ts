// Raw status values returned by the API (Asaas/Cora gateway statuses)
export type EntryApiStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'RECEIVED_IN_CASH'
  | 'PAID'
  | 'OVERDUE'
  | 'OPEN'
  | 'CREATED'
  | 'ISSUED'
  | 'CANCELLED'
  | 'CANCELED'
  | 'EXPIRED';

// Human-readable status computed by the API (traducedStatus field)
export type TraducedStatus = 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado';

export type BillingType = 'BOLETO' | 'PIX' | 'MONEY' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER' | 'OTHER';
export type EntrySource = 'asaas' | 'cora' | 'sicredi' | 'manual' | 'proeduc';

export interface EntryCategory {
  id: string;
  name: string;
}

export interface EntryListItem {
 discount?:{value:number;type?:string;limitDate?:string;dueDateLimitDays?:number}|null;
 punctuality?:{originalValue:number;discountValue:number;discountedValue:number;deadline:string|null;eligible:boolean}|null;

  id: string;
  description?: string | null;
  value: number;
  originalValue?: number | null;
  dueDate?: string | null;
  paymentDate?: string | null;
  dateCreated?: string;
  // API returns uppercase gateway status
  status?: EntryApiStatus | null;
  // API-computed human label: 'Pendente' | 'Pago' | 'Atrasado' | 'Cancelado'
  traducedStatus?: TraducedStatus | null;
  billingType?: BillingType | string;
  source?: EntrySource | string;
  bankSlipUrl?: string | null;
  invoiceUrl?: string | null;
  installment?: string | null;
  installmentNumber?: number | null;
  payment?: string | null;
  customer?: string | null;
  deleted?: boolean;
  student?: {
    id: number;
    name: string;
    phoneNumber?: string;
    phone?: string;
    guardian?: { name: string; phoneNumber?: string; phone?: string };
  };
  category?: EntryCategory;
}

export interface EntryDetail extends EntryListItem {
  schoolId?: string;
  entryCategoryId?: string | null;
  payment?: string | null;
}

export interface EntriesIndexResponse {
  entries?: EntryListItem[];
  count?: number;
  page?: number;
  perPage?: number;
}

export interface EntryCreatePayload {
  description?: string;
  value: number;
  dueDate: string;
  billingType: string;
  entryCategoryId: string;
  student: number;
  paymentType: string;
  status: string;
  discount?: { value: number; type?: string };
  installmentCount?: number;
  installmentValue?: number;
  paymentDate?: string;
}

export interface EntryUpdatePayload {
  value?: number;
  paymentDate?: string;
  status?: string;
  description?: string;
}

export interface IEntryTableFilters {
  description: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}

// Normalises an entry to a simple display bucket regardless of gateway status
export function getTraducedStatus(entry: EntryListItem): TraducedStatus {
  const s = String(entry.status ?? '').toUpperCase();
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'PAID', 'PAGO'].includes(s)) return 'Pago';
  if (['OVERDUE', 'EXPIRED'].includes(s)) return 'Atrasado';
  if (['CANCELLED', 'CANCELED'].includes(s)) return 'Cancelado';
  if (entry.traducedStatus) return entry.traducedStatus;
  return 'Pendente';
}
