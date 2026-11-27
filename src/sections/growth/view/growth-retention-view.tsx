'use client';

import type { GrowthRetentionList, GrowthStudentAtRisk } from 'src/types/services/crm-deal';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fCurrency } from 'src/utils/format-number';

import { GrowthService } from 'src/services/growth';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { formatPhone } from 'src/sections/crm/inbox/utils';
import { useCrmAccess } from 'src/sections/crm/crm-access-context';
import { CrmAccessGuard } from 'src/sections/crm/crm-access-guard';

import { GROWTH_RISK_LABELS } from 'src/types/services/crm-deal';

import { CrmTaskDialog } from '../components/task-dialog';

// ----------------------------------------------------------------------

export function GrowthRetentionView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs heading="Retenção de alunos" links={[{ name: 'Growth', href: paths.dashboard.growth.root }, { name: 'Retenção' }]} sx={{ mb: 3 }} />
      <CrmAccessGuard min="supervisor">
        <Retention />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

function Retention() {
  const { can } = useCrmAccess();
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<GrowthRetentionList | null>(null);
  const [taskFor, setTaskFor] = useState<GrowthStudentAtRisk | null>(null);

  const load = useCallback(() => {
    GrowthService.retention({ reason: reason || undefined, search: search.trim() || undefined })
      .then(setResult)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar'));
  }, [reason, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const settings = result?.settings;
  const rows = result?.data ?? [];

  return (
    <Stack spacing={2}>
      {settings && (
        <Alert severity="info">
          Alunos ativos com mensalidade vencida há mais de {settings.overdueGraceDays} dia(s) ou com faltas acima de {settings.absenceRatePercent}% das
          aulas nos últimos {settings.absenceWindowDays} dias (mínimo de {settings.absenceMinClasses} aulas lançadas). Ajuste em{' '}
          <Link component={RouterLink} href={paths.dashboard.growth.settings}>
            Configurações
          </Link>
          .
        </Alert>
      )}
      <Card>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar aluno ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" />
                </InputAdornment>
              ),
            }}
          />
          <TextField select size="small" label="Sinal" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ minWidth: 170 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="inadimplencia">Inadimplência</MenuItem>
            <MenuItem value="faltas">Faltas</MenuItem>
          </TextField>
          <Typography variant="body2" sx={{ color: 'text.secondary', alignSelf: 'center', ml: { sm: 'auto' } }}>
            {rows.length} aluno(s) em risco
          </Typography>
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Aluno</TableCell>
                <TableCell>Risco</TableCell>
                <TableCell>Financeiro</TableCell>
                <TableCell>Frequência</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.student.id} hover>
                  <TableCell>
                    <Link component={RouterLink} href={paths.dashboard.students.details(String(r.student.id))} variant="subtitle2">
                      {r.student.name}
                    </Link>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {r.guardian?.name
                        ? `Resp.: ${r.guardian.name}${r.guardian.phoneNumber ? ` · ${formatPhone(r.guardian.phoneNumber) || r.guardian.phoneNumber}` : ''}`
                        : r.student.phoneNumber ?? ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      <Label color={r.level === 'alto' ? 'error' : 'warning'}>{r.level === 'alto' ? 'Alto' : 'Médio'}</Label>
                      {r.reasons.map((reasonKey) => (
                        <Label key={reasonKey} variant="soft">
                          {GROWTH_RISK_LABELS[reasonKey]}
                        </Label>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {r.signals.overdueCount
                      ? `${r.signals.overdueCount} vencida(s) · ${fCurrency(r.signals.overdueTotal)}${r.signals.oldestOverdueDays ? ` · há ${r.signals.oldestOverdueDays}d` : ''}`
                      : 'Em dia'}
                  </TableCell>
                  <TableCell>
                    {r.signals.classes ? `${r.signals.absences} falta(s) em ${r.signals.classes} aula(s)` : 'Sem frequência lançada'}
                    {r.absenceRate !== null ? ` · ${r.absenceRate}%` : ''}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant={r.openTasks ? 'text' : 'outlined'} onClick={() => setTaskFor(r)}>
                      {r.openTasks ? `Criar tarefa (${r.openTasks} aberta)` : 'Criar tarefa'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.disabled' }}>
                    Nenhum aluno em risco pelos critérios atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      <CrmTaskDialog
        open={!!taskFor}
        studentId={taskFor?.student.id}
        defaultTitle={taskFor ? `Retenção: falar com a família de ${taskFor.student.name}` : undefined}
        onClose={() => setTaskFor(null)}
        onSaved={() => load()}
        canSupervise={can('supervisor')}
      />
    </Stack>
  );
}
