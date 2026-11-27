// ----------------------------------------------------------------------

const intFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** 12.345 */
export function fInt(value: number | null | undefined) {
  return value == null ? '—' : intFormat.format(value);
}

/** US$ 0,0123 (custos de IA costumam ser frações de centavo). */
export function fUsd(value: number | null | undefined) {
  if (value == null) return '—';
  const digits = value !== 0 && Math.abs(value) < 1 ? 4 : 2;
  return `US$ ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: digits }).format(value)}`;
}

/** 850 ms / 2,4 s */
export function fLatency(ms: number | null | undefined) {
  if (ms == null) return '—';
  if (ms < 1000) return `${intFormat.format(ms)} ms`;
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(ms / 1000)} s`;
}

/** 1,2 MB / 830 KB */
export function fBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`;
  }
  return `${intFormat.format(Math.ceil(bytes / 1024))} KB`;
}
