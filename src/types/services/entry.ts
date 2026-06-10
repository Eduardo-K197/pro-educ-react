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

export type BillingType = 'BOLETO' | 'PIX' | 'MONEY' | 'CREDIT_CARD';
export type EntrySource = 'asaas' | 'cora' | 'manual' | 'proeduc';

export interface EntryCategory {
  id: string;
  name: string;
}

export interface EntryListItem {
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
  customer?: string | null;
  deleted?: boolean;
  student?: {
    id: number;
    name: string;
    phoneNumber?: string;
    guardian?: { name: string; phoneNumber?: string };
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
  dueDate?: string;
  billingType?: BillingType;
  categoryId?: string;
  studentId?: number;
  discount?: number;
}

export interface EntryUpdatePayload {
  value?: number;
  paidAt?: string;
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
  if (entry.traducedStatus) return entry.traducedStatus;
  const s = entry.status ?? '';
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'PAID'].includes(s)) return 'Pago';
  if (['OVERDUE', 'EXPIRED'].includes(s)) return 'Atrasado';
  if (['CANCELLED', 'CANCELED'].includes(s)) return 'Cancelado';
  return 'Pendente';
}
