'use client';

import type { CrmQuickReply } from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { hasCrmRole } from 'src/hooks/use-crm-permission';

import { CrmService } from 'src/services/crm';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';

// ----------------------------------------------------------------------

export function CrmQuickReplyListView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Respostas rápidas"
        links={[{ name: 'CRM', href: paths.dashboard.crm.root }, { name: 'Respostas rápidas' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      <CrmAccessGuard min="agente">
        <QuickReplyList />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function QuickReplyList() {
  const { me } = useCrmAccess();
  const canSchool = hasCrmRole(me?.role, 'supervisor');
  const [rows, setRows] = useState<CrmQuickReply[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CrmQuickReply | 'new' | null>(null);
  const [form, setForm] = useState({ shortcut: '', body: '', scope: 'user' as 'user' | 'school' });

  const load = useCallback(() => {
    CrmService.listQuickReplies(search || undefined)
      .then(setRows)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar'));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const open = (row: CrmQuickReply | 'new') => {
    setEditing(row);
    setForm(row === 'new' ? { shortcut: '', body: '', scope: 'user' } : { shortcut: row.shortcut, body: row.body, scope: row.scope });
  };

  const save = async () => {
    try {
      if (editing === 'new') await CrmService.createQuickReply(form);
      else if (editing) await CrmService.updateQuickReply(editing.id, { shortcut: form.shortcut, body: form.body });
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar');
    }
  };

  const remove = async (row: CrmQuickReply) => {
    try {
      await CrmService.deleteQuickReply(row.id);
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover');
    }
  };

  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField size="small" placeholder="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 360 }} />
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => open('new')}>
          Nova resposta
        </Button>
      </Stack>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width={180}>Atalho</TableCell>
                <TableCell>Texto</TableCell>
                <TableCell width={120}>Escopo</TableCell>
                <TableCell width={100} />
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>/{r.shortcut}</TableCell>
                  <TableCell sx={{ whiteSpace: 'pre-wrap', maxWidth: 520 }}>{r.body}</TableCell>
                  <TableCell>
                    <Label color={r.scope === 'school' ? 'info' : 'default'}>{r.scope === 'school' ? 'Escola' : 'Pessoal'}</Label>
                  </TableCell>
                  <TableCell align="right">
                    {r.editable && (
                      <>
                        <IconButton size="small" onClick={() => open(r)}>
                          <Iconify icon="solar:pen-bold" width={18} />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => remove(r)}>
                          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                    Nenhuma resposta rápida. No atendimento, digite / para usar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={!!editing} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>{editing === 'new' ? 'Nova resposta rápida' : 'Editar resposta rápida'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Atalho"
              value={form.shortcut}
              onChange={(e) => setForm((f) => ({ ...f, shortcut: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
              helperText="Sem espaços. No atendimento: /atalho"
            />
            <TextField label="Texto" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} multiline minRows={4} />
            {editing === 'new' && (
              <TextField select label="Escopo" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as any }))}>
                <MenuItem value="user">Pessoal (só eu)</MenuItem>
                {canSchool && <MenuItem value="school">Escola (toda a equipe)</MenuItem>}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancelar</Button>
          <Button variant="contained" onClick={save} disabled={!form.shortcut || !form.body.trim()}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
