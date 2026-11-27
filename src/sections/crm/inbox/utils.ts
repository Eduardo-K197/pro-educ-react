import type { CrmMe, CrmConversation, CrmMessageStatus } from 'src/types/services/crm';

import { hasCrmRole } from 'src/hooks/use-crm-permission';

// ----------------------------------------------------------------------

export type InboxTab = 'pending' | 'open' | 'closed';

export const INBOX_TABS: { value: InboxTab; label: string; statuses: string }[] = [
  { value: 'pending', label: 'Pendentes', statuses: 'bot,ai,pending' },
  { value: 'open', label: 'Em atendimento', statuses: 'open' },
  { value: 'closed', label: 'Encerradas', statuses: 'closed' },
];

export function tabOfStatus(status: CrmConversation['status']): InboxTab {
  if (status === 'open') return 'open';
  if (status === 'closed') return 'closed';
  return 'pending';
}

/** Mesma regra do backend (CrmVisibility): usada para tirar da lista quem perdeu acesso. */
export function canSeeConversation(me: CrmMe | null, conv: CrmConversation): boolean {
  if (!me?.role) return false;
  if (hasCrmRole(me.role, 'supervisor')) return true;
  if (conv.assignee?.id === me.user.id) return true;
  if (conv.departmentId) return me.departmentIds.includes(conv.departmentId);
  return (
    conv.channel.agentsSeeUnassigned !== false &&
    (conv.status === 'pending' || conv.status === 'bot' || conv.status === 'ai')
  );
}

/** Conversas sem atendente humano: menu automático (bot) ou IA atendendo (ai). */
export function pendingCount(counts: Record<string, number>) {
  return (counts.pending ?? 0) + (counts.bot ?? 0) + (counts.ai ?? 0);
}

export function isMine(me: CrmMe | null, conv: CrmConversation | null) {
  return !!me && !!conv?.assignee && conv.assignee.id === me.user.id;
}

export function formatPhone(phone?: string | null) {
  if (!phone) return '';
  const d = phone.replace(/\D/g, '');
  if (d.startsWith('55') && (d.length === 12 || d.length === 13)) {
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    return `+55 (${ddd}) ${rest.slice(0, rest.length - 4)}-${rest.slice(-4)}`;
  }
  return `+${d}`;
}

export const MESSAGE_STATUS_ICON: Record<CrmMessageStatus, { icon: string; color: string; label: string }> = {
  pending: { icon: 'solar:clock-circle-outline', color: 'text.disabled', label: 'Aguardando' },
  queued: { icon: 'solar:clock-circle-outline', color: 'text.disabled', label: 'Na fila' },
  sent: { icon: 'eva:checkmark-fill', color: 'text.disabled', label: 'Enviada' },
  delivered: { icon: 'eva:done-all-fill', color: 'text.disabled', label: 'Entregue' },
  read: { icon: 'eva:done-all-fill', color: 'info.main', label: 'Lida' },
  played: { icon: 'eva:done-all-fill', color: 'info.main', label: 'Ouvida' },
  failed: { icon: 'solar:danger-triangle-bold', color: 'error.main', label: 'Falhou' },
  received: { icon: '', color: 'text.disabled', label: '' },
};

export function initials(name?: string | null) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

// ---------------------------------------------------------------------- notificação

const MUTE_KEY = 'proeduc-crm-mute';

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setMuted(value: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0');
  } catch {
    // ignore
  }
}

let audioCtx: AudioContext | null = null;

/** Bipe curto (sem arquivo de áudio). */
export function playNotificationSound() {
  if (typeof window === 'undefined' || isMuted()) return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx ?? new Ctx();
    const ctx = audioCtx!;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.11);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.12);
    });
  } catch {
    // navegador bloqueou áudio sem interação: ignora
  }
}
