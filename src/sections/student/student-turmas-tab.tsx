'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import axiosInstance from 'src/utils/axios';
import { ClassroomService } from 'src/services/classroom';
import type { SubscriptionDetail } from 'src/services/subscription';
import { SubscriptionService } from 'src/services/subscription';
import type { ClassroomListItem } from 'src/types/services/classroom';

// ----------------------------------------------------------------------

interface Props {
  studentId: number;
}

export function StudentTurmasTab({ studentId }: Props) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetail[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SubscriptionDetail | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null);

  const [formClassroomId, setFormClassroomId] = useState('');
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');

  const loadSubscriptions = useCallback(() => {
    setLoading(true);
    SubscriptionService.list({ student: String(studentId), deleted: 'false' })
      .then((res) => setSubscriptions(res.subscriptions ?? []))
      .catch(() => toast.error('Erro ao carregar matrículas'))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    loadSubscriptions();
    ClassroomService.list({ perPage: '100' })
      .then((res) => setClassrooms(res.classrooms ?? []))
      .catch(() => {});
  }, [loadSubscriptions]);

  const openDialog = () => {
    setFormClassroomId('');
    setFormStartAt('');
    setFormEndAt('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formClassroomId) {
      toast.error('Selecione a turma');
      return;
    }
    setSaving(true);
    try {
      await SubscriptionService.create({
        studentId,
        classroomId: formClassroomId,
        startAt: formStartAt || undefined,
        endAt: formEndAt || undefined,
      });
      toast.success('Matrícula realizada!');
      setDialogOpen(false);
      loadSubscriptions();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Erro ao matricular aluno';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await SubscriptionService.delete(pendingDelete.id);
      toast.success('Matrícula cancelada');
      loadSubscriptions();
    } catch {
      toast.error('Erro ao cancelar matrícula');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const handleGenerateCertificate = async (sub: SubscriptionDetail) => {
    setGeneratingCertId(sub.id);
    try {
      await axiosInstance.post(`/certificates/${sub.id}`);
      toast.success('Certificado gerado!');
      loadSubscriptions();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Erro ao gerar certificado';
      toast.error(msg);
    } finally {
      setGeneratingCertId(null);
    }
  };

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 2.5 }}>
        <Stack direction="row" justifyContent="flex-end">
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openDialog}
          >
            Matricular em turma
          </Button>
        </Stack>
      </Card>

      <Card>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : subscriptions.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.disabled' }}>
            <Iconify icon="solar:diploma-bold-duotone" width={40} />
            <Typography variant="body2">Aluno não matriculado em nenhuma turma.</Typography>
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Turma</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Curso</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Início</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Conclusão</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Presenças</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Certificado</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {subscriptions.map((sub) => {
                  const totalClasses = sub.presences?.length ?? 0;
                  const present = sub.presences?.filter((p) => p.status === 'present').length ?? 0;
                  const hasCert = !!sub.certificate;
                  const isGenerating = generatingCertId === sub.id;
                  return (
                    <TableRow key={sub.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {sub.classroom?.name ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {sub.classroom?.course?.name ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {sub.startAt ? fDate(sub.startAt) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {sub.endAt ? fDate(sub.endAt) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {totalClasses > 0 ? (
                          <Chip
                            size="small"
                            label={`${present}/${totalClasses}`}
                            color={present / totalClasses >= 0.75 ? 'success' : 'warning'}
                            variant="soft"
                          />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasCert ? (
                          <Tooltip title="Ver certificado">
                            <Button
                              size="small"
                              variant="soft"
                              color="success"
                              startIcon={<Iconify icon="solar:diploma-bold-duotone" width={14} />}
                              component="a"
                              href={`/certificates/${(sub.certificate as any)?.id ?? sub.certificate}/view`}
                              target="_blank"
                              sx={{ fontSize: 11, height: 26, px: 1 }}
                            >
                              Ver
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Gerar certificado">
                            <span>
                              <Button
                                size="small"
                                variant="soft"
                                color="warning"
                                startIcon={
                                  isGenerating ? (
                                    <CircularProgress size={12} />
                                  ) : (
                                    <Iconify icon="solar:diploma-bold-duotone" width={14} />
                                  )
                                }
                                onClick={() => handleGenerateCertificate(sub)}
                                disabled={isGenerating}
                                sx={{ fontSize: 11, height: 26, px: 1 }}
                              >
                                Gerar
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remover da turma">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setPendingDelete(sub)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Enroll dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Matricular em turma</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Turma *</InputLabel>
              <Select
                value={formClassroomId}
                label="Turma *"
                onChange={(e) => setFormClassroomId(e.target.value)}
              >
                {classrooms.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                    {c.course?.name ? ` — ${c.course.name}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              size="small"
              label="Início"
              type="date"
              value={formStartAt}
              onChange={(e) => setFormStartAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              size="small"
              label="Conclusão prevista"
              type="date"
              value={formEndAt}
              onChange={(e) => setFormEndAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Matricular'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm remove dialog */}
      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Remover da turma"
        content={`Tem certeza que deseja remover o aluno da turma "${pendingDelete?.classroom?.name ?? ''}"? Esta ação não pode ser desfeita.`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? 'Removendo...' : 'Remover'}
          </Button>
        }
      />
    </Stack>
  );
}
