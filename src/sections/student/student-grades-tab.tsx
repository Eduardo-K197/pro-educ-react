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
import CircularProgress from '@mui/material/CircularProgress';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { CourseService } from 'src/services/course';
import type { Grade, CoursePeriod } from 'src/services/grade';
import { GradeService } from 'src/services/grade';
import type { StudentSubscription } from 'src/types/services/student';

// ----------------------------------------------------------------------

interface CourseSubject {
  id: string;
  subjectId: string;
  subject: { id: string; name: string };
}

interface CourseWithSubjects {
  id: string;
  name: string;
  courseSubjects?: CourseSubject[];
  gradeSetting?: { minGrade: number; maxGrade: number; step: number };
}

interface Props {
  studentId: number;
  subscriptions?: StudentSubscription[];
}

// ----------------------------------------------------------------------

export function StudentGradesTab({ studentId, subscriptions = [] }: Props) {
  const courses = subscriptions
    .map((s) => s.course ?? s.classroom?.course)
    .filter((c): c is { id: string; name: string } => !!c?.id)
    .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? '');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  const [courseDetail, setCourseDetail] = useState<CourseWithSubjects | null>(null);
  const [periods, setPeriods] = useState<CoursePeriod[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  const [loadingCourse, setLoadingCourse] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);

  const [formSubjectId, setFormSubjectId] = useState('');
  const [formPeriodId, setFormPeriodId] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formKind, setFormKind] = useState('');
  const [formWeight, setFormWeight] = useState('1');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load course detail + periods when course changes
  useEffect(() => {
    if (!selectedCourseId) return;
    setLoadingCourse(true);
    setCourseDetail(null);
    setPeriods([]);
    setSelectedPeriodId('');

    Promise.all([
      CourseService.getById(selectedCourseId),
      GradeService.listPeriods(selectedCourseId),
    ])
      .then(([course, periodsData]) => {
        setCourseDetail(course as unknown as CourseWithSubjects);
        const list = Array.isArray(periodsData) ? periodsData : [];
        setPeriods(list);
      })
      .catch(() => toast.error('Erro ao carregar dados do curso'))
      .finally(() => setLoadingCourse(false));
  }, [selectedCourseId]);

  const loadGrades = useCallback(() => {
    if (!selectedCourseId) return;
    setLoadingGrades(true);
    const params: { courseId?: string; periodId?: string } = { courseId: selectedCourseId };
    if (selectedPeriodId) params.periodId = selectedPeriodId;
    GradeService.listForStudent(studentId, params)
      .then((res) => setGrades(res.grades ?? []))
      .catch(() => toast.error('Erro ao carregar notas'))
      .finally(() => setLoadingGrades(false));
  }, [studentId, selectedCourseId, selectedPeriodId]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const openAddDialog = () => {
    setEditingGrade(null);
    setFormSubjectId('');
    setFormPeriodId(selectedPeriodId);
    setFormValue('');
    setFormKind('');
    setFormWeight('1');
    setDialogOpen(true);
  };

  const openEditDialog = (grade: Grade) => {
    setEditingGrade(grade);
    setFormSubjectId(grade.subjectId ?? '');
    setFormPeriodId(grade.periodId ?? '');
    setFormValue(String(grade.value));
    setFormKind(grade.kind ?? '');
    setFormWeight(String(grade.weight ?? 1));
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const handleSave = async () => {
    const val = parseFloat(formValue);
    if (Number.isNaN(val)) {
      toast.error('Informe um valor numérico para a nota');
      return;
    }
    if (!editingGrade && !formSubjectId) {
      toast.error('Selecione a matéria');
      return;
    }
    setSaving(true);
    try {
      if (editingGrade) {
        await GradeService.update(studentId, editingGrade.id, {
          value: val,
          periodId: formPeriodId || null,
          kind: formKind || null,
          weight: parseFloat(formWeight) || 1,
        });
        toast.success('Nota atualizada');
      } else {
        await GradeService.create(studentId, {
          subjectId: formSubjectId,
          value: val,
          periodId: formPeriodId || undefined,
          kind: formKind || undefined,
          weight: parseFloat(formWeight) || 1,
        });
        toast.success('Nota lançada');
      }
      closeDialog();
      loadGrades();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao salvar nota';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (grade: Grade) => {
    setDeletingId(grade.id);
    try {
      await GradeService.delete(studentId, grade.id);
      toast.success('Nota removida');
      loadGrades();
    } catch {
      toast.error('Erro ao remover nota');
    } finally {
      setDeletingId(null);
    }
  };

  const subjects = courseDetail?.courseSubjects ?? [];
  const setting = courseDetail?.gradeSetting;
  const settingHint = setting
    ? `Valor entre ${setting.minGrade} e ${setting.maxGrade}, passo ${setting.step}`
    : undefined;

  if (!courses.length) {
    return (
      <Card sx={{ p: 4 }}>
        <Stack alignItems="center" spacing={1} color="text.disabled">
          <Iconify icon="solar:diploma-bold-duotone" width={40} />
          <Typography variant="body2">Aluno sem matrícula em nenhum curso.</Typography>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Filters */}
      <Card sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          {courses.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>Curso</InputLabel>
              <Select
                value={selectedCourseId}
                label="Curso"
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                {courses.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriodId}
              label="Período"
              onChange={(e) => setSelectedPeriodId(e.target.value)}
            >
              <MenuItem value="">Todos os períodos</MenuItem>
              {periods.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flex: 1 }} />

          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={openAddDialog}
            disabled={loadingCourse}
          >
            Lançar nota
          </Button>
        </Stack>
      </Card>

      {/* Grades table */}
      <Card>
        {loadingGrades || loadingCourse ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : grades.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.disabled' }}>
            <Iconify icon="solar:diploma-bold-duotone" width={40} />
            <Typography variant="body2">Nenhuma nota lançada ainda.</Typography>
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Matéria</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Nota</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Peso</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((g) => {
                  const period = periods.find((p) => p.id === g.periodId);
                  return (
                    <TableRow key={g.id} hover>
                      <TableCell>{g.subject?.name ?? '—'}</TableCell>
                      <TableCell>
                        {g.kind ? (
                          <Chip label={g.kind} size="small" variant="soft" />
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {period?.name ?? (g.periodId ? g.periodId : '—')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {Number(g.value).toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {Number(g.weight).toFixed(1)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                          <IconButton size="small" onClick={() => openEditDialog(g)}>
                            <Iconify icon="solar:pen-bold" width={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(g)}
                            disabled={deletingId === g.id}
                          >
                            {deletingId === g.id ? (
                              <CircularProgress size={14} color="error" />
                            ) : (
                              <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                            )}
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editingGrade ? 'Editar nota' : 'Lançar nota'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {!editingGrade && (
              <FormControl fullWidth size="small">
                <InputLabel>Matéria *</InputLabel>
                <Select
                  value={formSubjectId}
                  label="Matéria *"
                  onChange={(e) => setFormSubjectId(e.target.value)}
                >
                  {subjects.map((cs) => (
                    <MenuItem key={cs.subjectId} value={cs.subjectId}>
                      {cs.subject?.name ?? cs.subjectId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                value={formPeriodId}
                label="Período"
                onChange={(e) => setFormPeriodId(e.target.value)}
              >
                <MenuItem value="">Sem período</MenuItem>
                {periods.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Nota *"
              type="number"
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              helperText={settingHint}
              inputProps={
                setting
                  ? { min: setting.minGrade, max: setting.maxGrade, step: setting.step }
                  : { step: 0.1 }
              }
            />

            <TextField
              fullWidth
              size="small"
              label="Tipo (ex.: Prova 1, Trabalho)"
              value={formKind}
              onChange={(e) => setFormKind(e.target.value)}
            />

            <TextField
              fullWidth
              size="small"
              label="Peso"
              type="number"
              value={formWeight}
              onChange={(e) => setFormWeight(e.target.value)}
              inputProps={{ min: 0, step: 0.5 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
