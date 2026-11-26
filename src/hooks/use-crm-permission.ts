'use client';

import type { CrmMe, CrmRole } from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import { CrmService } from 'src/services/crm';

// ----------------------------------------------------------------------

const RANK: Record<CrmRole, number> = { agente: 1, supervisor: 2, gestor: 3 };

export function hasCrmRole(role: CrmRole | null | undefined, min: CrmRole) {
  return !!role && RANK[role] >= RANK[min];
}

/** Papel do usuário no CRM da escola atual (GET /crm/me). */
export function useCrmPermission() {
  const [me, setMe] = useState<CrmMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    CrmService.me()
      .then((data) => {
        if (!cancelled) setMe(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setMe(null);
          setError(err?.message || 'Não foi possível consultar o acesso ao CRM');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const reload = useCallback(() => setRefreshKey((k) => k + 1), []);
  const can = useCallback((min: CrmRole) => hasCrmRole(me?.role, min), [me]);

  return { me, role: me?.role ?? null, loading, error, can, reload };
}
