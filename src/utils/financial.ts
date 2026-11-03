import type { EntryListItem, EntryCreatePayload } from 'src/types/services/entry';

export function mergeFinancialEntries(entries: EntryListItem[], payments: EntryListItem[]) {
  const byId = new Map<string, EntryListItem>();
  [...entries, ...payments].forEach((entry) => {
    if (entry.id && !entry.deleted) byId.set(entry.id, entry);
  });
  return Array.from(byId.values());
}

export function buildEntryPayload(input: {
  value: number; discount: number; dueDate: string; billingType: string;
  categoryId: string; studentId: number; description?: string; installmentCount?: number; status?: string; paymentDate?: string; amountMode?: string;
}): EntryCreatePayload {
  if (!Number.isFinite(input.value) || input.value <= 0) throw new Error('Informe um valor maior que zero.');
  if (!Number.isFinite(input.discount) || input.discount < 0 || input.discount >= input.value) {
    throw new Error('O desconto deve ser menor que o valor e não pode ser negativo.');
  }
  if (!input.dueDate || !input.categoryId || !Number.isInteger(input.studentId) || input.studentId <= 0) {
    throw new Error('Informe aluno, categoria e vencimento.');
  }
  const count = input.installmentCount ?? 1;
  if (!Number.isInteger(count) || count < 1) throw new Error('Informe um número inteiro de parcelas maior que zero.');
  const gateway = input.billingType === 'BOLETO';
  const cents = Math.round(input.value * 100);
  if (Math.abs(input.value * 100 - cents) > 1e-7 || Math.abs(input.discount * 100 - Math.round(input.discount * 100)) > 1e-7) throw new Error('Informe valores com no máximo duas casas decimais.');
  const splitTotal = gateway && count > 1 && input.amountMode === 'total';
  if (splitTotal && cents % count !== 0) throw new Error('O total não pode ser dividido igualmente em centavos. Informe um valor por parcela ou ajuste o total.');
  const chargeValue = splitTotal ? cents / count / 100 : input.value;
  if (input.discount >= chargeValue) throw new Error('O desconto deve ser menor que o valor de cada parcela.');
  const received = !gateway && input.status === 'RECEIVED_IN_CASH';
  if (received && !input.paymentDate) throw new Error('Informe a data do recebimento.');
  return {
    value: chargeValue,
    student: input.studentId,
    entryCategoryId: input.categoryId,
    dueDate: `${input.dueDate.slice(0, 10)}T12:00:00.000Z`,
    billingType: input.billingType,
    paymentType: gateway && count > 1 ? 'installmentValue' : 'value',
    status: received ? 'RECEIVED_IN_CASH' : 'PENDING',
    ...(received ? { paymentDate: input.paymentDate } : {}),
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    ...(gateway && count > 1 ? { installmentCount: count, installmentValue: chargeValue } : {}),
    ...(input.discount > 0 ? { discount: gateway ? { value: input.discount, type: 'FIXED' } : { value: input.discount } } : {}),
  };
}

export function localDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
