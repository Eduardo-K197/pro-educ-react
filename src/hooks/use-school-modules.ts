'use client';

import type { SchoolModuleName } from 'src/services/school-modules';

import { useState, useEffect, useCallback } from 'react';

import { STORAGE_KEYS } from 'src/utils/axios';

import { SchoolModuleService } from 'src/services/school-modules';

// ----------------------------------------------------------------------

type Modules = Record<SchoolModuleName, boolean>;

const EMPTY: Modules = { crm: false, learning: false };
const CHANGED_EVENT = 'proeduc:school-modules-changed';
const cache = new Map<string, Promise<Modules>>();

function currentSchoolId() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(STORAGE_KEYS.schoolId);
}

function fetchModules(schoolId: string): Promise<Modules> {
  let pending = cache.get(schoolId);
  if (!pending) {
    pending = SchoolModuleService.current()
      .then((res) => ({ ...EMPTY, ...res.modules }))
      .catch(() => {
        cache.delete(schoolId);
        return EMPTY;
      });
    cache.set(schoolId, pending);
  }
  return pending;
}

/** Avisa as telas abertas que os módulos mudaram (ex.: super admin ligou o CRM). */
export function notifySchoolModulesChanged() {
  cache.clear();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGED_EVENT));
}

/**
 * Módulos pagos da escola selecionada (sem escola = nenhum).
 * Desligado por padrão enquanto carrega, para não piscar menu/rota pagos.
 */
export function useSchoolModules() {
  const [modules, setModules] = useState<Modules>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(CHANGED_EVENT, onChange);
    return () => window.removeEventListener(CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    const schoolId = currentSchoolId();
    if (!schoolId) {
      setModules(EMPTY);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    fetchModules(schoolId).then((m) => {
      if (!cancelled) {
        setModules(m);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = useCallback(() => notifySchoolModulesChanged(), []);
  return { modules, loading, reload };
}
