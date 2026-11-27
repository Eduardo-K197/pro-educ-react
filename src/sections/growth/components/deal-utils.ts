'use client';

import type { CrmDeal, CrmTask, CrmPipeline, GrowthOwner, GrowthCourse } from 'src/types/services/crm-deal';

import { useState, useEffect } from 'react';

import { GrowthService } from 'src/services/growth';

// ----------------------------------------------------------------------

/** Quem pode ser responsável (membros ativos do CRM + admins da escola). */
export function useGrowthOwners(enabled = true) {
  const [owners, setOwners] = useState<GrowthOwner[]>([]);
  useEffect(() => {
    if (!enabled) return;
    GrowthService.listOwners()
      .then(setOwners)
      .catch(() => setOwners([]));
  }, [enabled]);
  return owners;
}

/** Cursos da escola (curso de interesse do lead). */
export function useGrowthCourses(enabled = true) {
  const [courses, setCourses] = useState<GrowthCourse[]>([]);
  useEffect(() => {
    if (!enabled) return;
    GrowthService.listCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [enabled]);
  return courses;
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
