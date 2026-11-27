'use client';

import type { CrmAgent } from 'src/types/services/crm';
import type { CrmDeal, CrmTask, CrmPipeline } from 'src/types/services/crm-deal';

import { useState, useEffect } from 'react';

import { CrmService } from 'src/services/crm';

// ----------------------------------------------------------------------

/** Membros do CRM (para escolher responsável comercial / de tarefa). */
export function useCrmAgents(enabled = true) {
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  useEffect(() => {
    if (!enabled) return;
    CrmService.listAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, [enabled]);
  return agents;
}

export function stageOf(pipeline: CrmPipeline | null | undefined, stageId: string) {
  return pipeline?.stages.find((s) => s.id === stageId) ?? null;
}

export function wonStage(pipeline: CrmPipeline | null | undefined) {
  return pipeline?.stages.find((s) => s.active && s.kind === 'won') ?? null;
}

/** Junta (ou remove) um lead numa lista, mantendo os mais recentes primeiro. */
export function upsertDeal(list: CrmDeal[], deal: CrmDeal) {
  const index = list.findIndex((d) => d.id === deal.id);
  if (index === -1) return [deal, ...list];
  const next = [...list];
  next[index] = deal;
  return next;
}

export function upsertTask(list: CrmTask[], task: CrmTask) {
  const index = list.findIndex((t) => t.id === task.id);
  if (index === -1) return [task, ...list];
  const next = [...list];
  next[index] = { ...next[index], ...task, deal: task.deal ?? next[index].deal };
  return next;
}

/** Dias desde a data (para "sem interação há X dias"). */
export function daysSince(date: string | null | undefined) {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

/** Converte a data ISO para o valor de um input datetime-local. */
export function toLocalInput(date: string | null | undefined) {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Chave usada para levar os dados do lead até a tela de cadastro de aluno. */
export const CRM_DEAL_PREFILL_PARAM = 'crmDeal';
