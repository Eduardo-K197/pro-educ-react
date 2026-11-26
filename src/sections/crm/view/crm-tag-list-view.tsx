'use client';

import type { CrmTag } from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { hasCrmRole } from 'src/hooks/use-crm-permission';

import { CrmService } from 'src/services/crm';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';

// ----------------------------------------------------------------------

const COLORS = ['#00A76F', '#00B8D9', '#8E33FF', '#FFAB00', '#FF5630', '#637381', '#1877F2', '#B71D18'];

export function CrmTagListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Tags" links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Tags' }]} sx={{ mb: { xs: 3, md: 5 } }} />
      <CrmAccessGuard min="agente">
        <TagList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function TagList() {
  const { me } = useCrmAccess();
  const canManage = hasCrmRole(me?.role, 'supervisor');
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const load = useCallback(() => {
    CrmService.listTags()
      .then(setTags)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar tags'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    try {
      await CrmService.createTag({ name: name.trim(), color });
      setName('');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao criar tag');
    }
  };

  const update = async (tag: CrmTag, patch: { name?: string; color?: string }) => {
    try {
      await CrmService.updateTag(tag.id, patch);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar tag');
    }
  };

  const remove = async (tag: CrmTag) => {
    try {
      await CrmService.deleteTag(tag.id);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover tag');
    }
  };

  const swatches = (value: string, onPick: (c: string) => void) => (
    <Stack direction="row" spacing={0.5}>
      {COLORS.map((c) => (
        <Box
          key={c}
          onClick={() => onPick(c)}
          sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: c, cursor: 'pointer', outline: value === c ? '2px solid' : 'none', outlineOffset: 2 }}
        />
      ))}
    </Stack>
  );

  return (
    <Card sx={{ p: 3 }}>
      {canManage && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
          <TextField size="small" label="Nova tag" value={name} onChange={(e) => setName(e.target.value)} inputProps={{ maxLength: 50 }} />
          {swatches(color, setColor)}
          <Button variant="contained" onClick={create} disabled={!name.trim()}>
            Adicionar
          </Button>
        </Stack>
      )}
      <Stack spacing={1.5}>
        {tags.map((t) => (
          <Stack key={t.id} direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: t.color, flexShrink: 0 }} />
            {canManage ? (
              <TextField
                size="small"
                defaultValue={t.name}
                onBlur={(e) => e.target.value.trim() && e.target.value !== t.name && update(t, { name: e.target.value.trim() })}
                sx={{ minWidth: 200 }}
              />
            ) : (
              <Typography sx={{ minWidth: 200 }}>{t.name}</Typography>
            )}
            {canManage && swatches(t.color, (c) => update(t, { color: c }))}
            <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
              {t.usage ?? 0} conversa(s)
            </Typography>
            {canManage && (
              <IconButton size="small" color="error" onClick={() => remove(t)}>
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            )}
          </Stack>
        ))}
        {!tags.length && (
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Nenhuma tag cadastrada.
          </Typography>
        )}
      </Stack>
    </Card>
  );
}
