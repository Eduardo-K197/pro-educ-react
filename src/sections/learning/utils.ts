import type { LessonType } from 'src/services/learning';

export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  video: 'Vídeo',
  text: 'Texto',
  file: 'Arquivo',
};

export const LESSON_TYPE_ICON: Record<LessonType, string> = {
  video: 'solar:play-circle-bold-duotone',
  text: 'solar:document-text-bold-duotone',
  file: 'solar:file-download-bold-duotone',
};

export function fDuration(seconds: number | null | undefined) {
  if (!seconds) return '';
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim();
}

export function fBytes(size: number | null | undefined) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/** Move o item `index` uma posição para cima (-1) ou para baixo (+1). */
export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] | null {
  const target = index + delta;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
