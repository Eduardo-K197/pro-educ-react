'use client';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';

import type { LessonDetail, LessonSubscription, LessonPresence } from 'src/types/services/lesson';
import type { PresenceStatus } from 'src/services/presence';
import { PresenceService } from 'src/services/presence';

// ----------------------------------------------------------------------

const STATUS_LABEL: Record<PresenceStatus, string> = {
  present: 'Presente',
  absent: 'Ausente',
  justified: 'Justificado',
};

const STATUS_COLOR: Record<PresenceStatus, 'success' | 'error' | 'warning'> = {
  present: 'success',
  absent: 'error',
  justified: 'warning',
};

interface StudentRow {
  subscriptionId: string;
  studentName: string;
  presenceId?: string;
  currentStatus: PresenceStatus;
  originalStatus?: PresenceStatus;
}

interface Props {
  lesson: LessonDetail;
  onSaved?: () => void;
}

export function LessonChamadaTab({ lesson, onSaved }: Props) {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const subs: LessonSubscription[] = lesson.classroom?.subscriptions ?? [];
    const presences: LessonPresence[] = lesson.presences ?? [];

    const built: StudentRow[] = subs
      .filter((s) => s.student)
      .sort((a, b) => (a.student!.name < b.student!.name ? -1 : 1))
      .map((sub) => {
        const existing = presences.find((p) => p.subscription?.id === sub.id);
        const status = (existing?.status ?? 'absent') as PresenceStatus;
        return {
          subscriptionId: sub.id,
          studentName: sub.student!.name,
          presenceId: existing?.id,
          currentStatus: status,
          originalStatus: existing?.status as PresenceStatus | undefined,
        };
      });

    setRows(built);
    setSaved(presences.length > 0);
  }, [lesson]);

  const setStatus = (subscriptionId: string, status: PresenceStatus) => {
    setRows((prev) =>
      prev.map((r) => (r.subscriptionId === subscriptionId ? { ...r, currentStatus: status } : r))
    );
    setSaved(false);
  };

  const handleSave = async () => {
    if (!lesson.id) return;
    setSaving(true);
    try {
      const toCreate = rows.filter((r) => !r.presenceId);
      const toUpdate = rows.filter(
        (r) => r.presenceId && r.currentStatus !== r.originalStatus
      );

      if (toCreate.length > 0) {
        await PresenceService.create(
          toCreate.map((r) => ({
            classId: lesson.id!,
            subscriptionId: r.subscriptionId,
            status: r.currentStatus,
          }))
        );
      }

      if (toUpdate.length > 0) {
        await PresenceService.update(
          toUpdate.map((r) => ({ id: r.presenceId!, status: r.currentStatus }))
        );
      }

      // Update local state: all rows now have presenceId (simulate)
      setRows((prev) =>
        prev.map((r) => ({ ...r, originalStatus: r.currentStatus, presenceId: r.presenceId ?? 'saved' }))
      );

      setSaved(true);
      toast.success('Chamada salva!');
      onSaved?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao salvar chamada';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (rows.length === 0) {
    return (
      <Card sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={1} color="text.disabled">
          <Iconify icon="solar:users-group-rounded-bold-duotone" width={40} />
          <Typography variant="body2">Nenhum aluno matriculado nesta turma.</Typography>
        </Stack>
      </Card>
    );
  }

  const presentCount = rows.filter((r) => r.currentStatus === 'present').length;
  const attendancePct = Math.round((presentCount / rows.length) * 100);

  return (
    <Stack spacing={2}>
      {/* Summary */}
      <Card sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
          <Typography variant="subtitle2">
            {rows.length} aluno{rows.length !== 1 ? 's' : ''}
          </Typography>
          <Chip
            size="small"
            label={`Presentes: ${presentCount}/${rows.length} (${attendancePct}%)`}
            color={attendancePct >= 75 ? 'success' : 'warning'}
            variant="soft"
          />
          <Chip
            size="small"
            label={`Ausentes: ${rows.filter((r) => r.currentStatus === 'absent').length}`}
            color="error"
            variant="soft"
          />
          {rows.some((r) => r.currentStatus === 'justified') && (
            <Chip
              size="small"
              label={`Justificados: ${rows.filter((r) => r.currentStatus === 'justified').length}`}
              color="warning"
              variant="soft"
            />
          )}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={() =>
                setRows((prev) => prev.map((r) => ({ ...r, currentStatus: 'present' })))
              }
            >
              Todos presentes
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() =>
                setRows((prev) => prev.map((r) => ({ ...r, currentStatus: 'absent' })))
              }
            >
              Todos ausentes
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Student list */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Aluno</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 200 }}>Presença</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 120 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.subscriptionId}
                  sx={{
                    bgcolor:
                      row.currentStatus === 'present'
                        ? 'success.lighter'
                        : row.currentStatus === 'absent'
                          ? 'error.lighter'
                          : 'warning.lighter',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {row.studentName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={row.currentStatus}
                      onChange={(e) =>
                        setStatus(row.subscriptionId, e.target.value as PresenceStatus)
                      }
                      sx={{ minWidth: 160 }}
                    >
                      <MenuItem value="present">Presente</MenuItem>
                      <MenuItem value="absent">Ausente</MenuItem>
                      <MenuItem value="justified">Justificado</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Label
                      variant="soft"
                      color={STATUS_COLOR[row.currentStatus]}
                    >
                      {STATUS_LABEL[row.currentStatus]}
                    </Label>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Save */}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        {saved && (
          <Stack direction="row" alignItems="center" spacing={0.5} color="success.main">
            <Iconify icon="solar:check-circle-bold" width={18} />
            <Typography variant="caption">Chamada salva</Typography>
          </Stack>
        )}
        <LoadingButton
          variant="contained"
          loading={saving}
          loadingIndicator="Salvando..."
          onClick={handleSave}
          startIcon={<Iconify icon="solar:check-circle-bold" />}
        >
          Salvar chamada
        </LoadingButton>
      </Stack>
    </Stack>
  );
}
