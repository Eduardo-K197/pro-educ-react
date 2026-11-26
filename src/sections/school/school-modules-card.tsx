'use client';

import type { SchoolModuleInfo } from 'src/services/school-modules';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { notifySchoolModulesChanged } from 'src/hooks/use-school-modules';

import { fDateTime } from 'src/utils/format-time';

import { SchoolModuleService } from 'src/services/school-modules';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

/** Super admin: módulos pagos contratados pela escola (liga/desliga). */
export function SchoolModulesCard({ schoolId }: { schoolId: string }) {
  const [modules, setModules] = useState<SchoolModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    SchoolModuleService.list(schoolId)
      .then(setModules)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar módulos'))
      .finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (m: SchoolModuleInfo, enabled: boolean) => {
    setSaving(m.module);
    try {
      const updated = await SchoolModuleService.set(schoolId, m.module, enabled);
      setModules((prev) => prev.map((x) => (x.module === m.module ? updated : x)));
      notifySchoolModulesChanged();
      toast.success(`${m.label} ${enabled ? 'ativado' : 'desativado'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao alterar módulo');
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 0.5 }}>
        Módulos contratados
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Módulos pagos à parte. Desligado, o módulo some do menu da escola e a API recusa o acesso.
      </Typography>
      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <Stack spacing={1.5}>
          {modules.map((m) => (
            <Stack key={m.module} direction="row" alignItems="center" spacing={2}>
              <Switch checked={m.enabled} disabled={saving === m.module} onChange={(e) => toggle(m, e.target.checked)} />
              <Stack sx={{ flex: 1 }}>
                <Typography variant="subtitle2">{m.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {m.enabled
                    ? `Ativo${m.enabledAt ? ` desde ${fDateTime(m.enabledAt, 'DD/MM/YYYY HH:mm')}` : ''}`
                    : `Desativado${m.disabledAt ? ` em ${fDateTime(m.disabledAt, 'DD/MM/YYYY HH:mm')}` : ''}`}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}
