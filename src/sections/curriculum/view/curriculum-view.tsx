'use client';

import type { CourseListItem } from 'src/types/services/course';
import type { Subject, CoursePeriod } from 'src/types/services/curriculum';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { STORAGE_KEYS } from 'src/utils/axios';
import { missingStandardPeriods } from 'src/utils/standard-periods';

import { CourseService } from 'src/services/course';
import { DashboardContent } from 'src/layouts/dashboard';
import { CurriculumService } from 'src/services/curriculum';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { SubjectGroupsTab } from '../subject-groups-tab';

// ── helpers ──────────────────────────────────────────────────────────────

function useSchoolId() {
  const { user } = useAuthContext();
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(STORAGE_KEYS.schoolId);
    if (stored) return stored;
  }
  return (user?.schools as any[])?.[0]?.id ?? '';
}

// ── sub-views ─────────────────────────────────────────────────────────────

// -------- Tab 1: Matérias --------

function SubjectsTab({ schoolId }: { schoolId: string }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; item?: Subject }>({ open: false });
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmDelete = useBoolean();

  const load = useCallback(async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await CurriculumService.listSubjects(schoolId);
      setSubjects(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erro ao carregar matérias');
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setName(''); setCode(''); setDialog({ open: true }); };
  const openEdit = (s: Subject) => { setName(s.name); setCode(s.code ?? ''); setDialog({ open: true, item: s }); };
  const closeDialog = () => setDialog({ open: false });

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Informe o nome'); return; }
    setSaving(true);
    try {
      if (dialog.item) {
        await CurriculumService.updateSubject(schoolId, dialog.item.id, { name: name.trim(), code: code.trim() || undefined });
        toast.success('Matéria atualizada');
      } else {
        await CurriculumService.createSubject(schoolId, { name: name.trim(), code: code.trim() || undefined });
        toast.success('Matéria criada');
      }
      closeDialog();
      load();
    } catch {
      toast.error('Erro ao salvar matéria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await CurriculumService.deleteSubject(schoolId, id);
      toast.success('Matéria excluída');
      load();
    } catch {
      toast.error('Erro ao excluir matéria');
    } finally {
      confirmDelete.onFalse();
      setDeleteId(null);
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">Matérias da Escola</Typography>
        <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={openCreate}>
          Nova matéria
        </Button>
      </Stack>

      <Card>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.neutral' }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.neutral', width: 120 }}>Código</TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'background.neutral', width: 80 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {subjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                      Nenhuma matéria cadastrada
                    </TableCell>
                  </TableRow>
                )}
                {subjects.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>
                      {s.code ? <Chip label={s.code} size="small" variant="soft" /> : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(s)}>
                        <Iconify icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteId(s.id);
                          confirmDelete.onTrue();
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog.item ? 'Editar matéria' : 'Nova matéria'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField fullWidth label="Nome *" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <TextField fullWidth label="Código (opcional)" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: MAT01" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <LoadingButton loading={saving} variant="contained" onClick={handleSave}>Salvar</LoadingButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={() => {
          confirmDelete.onFalse();
          setDeleteId(null);
        }}
        title="Excluir matéria"
        content="Tem certeza que deseja excluir esta matéria?"
        action={
          <Button variant="contained" color="error" onClick={() => deleteId && handleDelete(deleteId)}>
            Excluir
          </Button>
        }
      />
    </>
  );
}

// -------- Tab 2: Grade por Curso --------

function CourseSubjectsTab({ schoolId, courses }: { schoolId: string; courses: CourseListItem[] }) {
  const [courseId, setCourseId] = useState('');
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [linked, setLinked] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (schoolId) {
      CurriculumService.listSubjects(schoolId).then((d) => setAllSubjects(Array.isArray(d) ? d : [])).catch(() => toast.error('Não foi possível carregar as matérias. Atualize a página antes de alterar a grade.'));
    }
  }, [schoolId]);

  const loadLinked = useCallback(async (cId: string) => {
    setLoading(true);
    try {
      const res = await CurriculumService.listCourseSubjects(cId);
      setLinked((res as any).subjects ?? []);
    } catch {
      toast.error('Erro ao carregar grade do curso');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    if (id) loadLinked(id);
    else setLinked([]);
  };

  const isLinked = (id: string) => linked.some((s) => s.id === id);

  const handleToggle = async (subject: Subject) => {
    if (!courseId) return;
    setSaving(subject.id);
    try {
      if (isLinked(subject.id)) {
        await CurriculumService.unlinkSubjectFromCourse(courseId, subject.id);
        setLinked((prev) => prev.filter((s) => s.id !== subject.id));
        toast.success('Matéria removida do curso');
      } else {
        await CurriculumService.linkSubjectToCourse(courseId, subject.id);
        setLinked((prev) => [...prev, subject]);
        toast.success('Matéria adicionada ao curso');
      }
    } catch {
      toast.error('Erro ao atualizar vínculo');
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ flexShrink: 0 }}>Grade do Curso</Typography>
        <TextField
          select
          size="small"
          label="Selecione o curso"
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">— Selecione —</MenuItem>
          {courses.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>
      </Stack>

      {!courseId ? (
        <Card sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1}>
            <Iconify icon="solar:book-2-bold-duotone" width={48} sx={{ color: 'text.disabled' }} />
            <Typography color="text.disabled">Selecione um curso para gerenciar sua grade</Typography>
          </Stack>
        </Card>
      ) : (
        <Card>
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.neutral' }}>Matéria</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.neutral', width: 100 }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.neutral', width: 120 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.neutral', width: 80 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allSubjects.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                        Nenhuma matéria cadastrada para a escola. Crie em &quot;Matérias&quot; primeiro.
                      </TableCell>
                    </TableRow>
                  )}
                  {allSubjects.map((s) => {
                    const active = isLinked(s.id);
                    return (
                      <TableRow key={s.id} hover>
                        <TableCell>{s.name}</TableCell>
                        <TableCell>{s.code ? <Chip label={s.code} size="small" variant="soft" /> : '—'}</TableCell>
                        <TableCell>
                          <Label variant="soft" color={active ? 'success' : 'default'}>
                            {active ? 'Na grade' : 'Fora da grade'}
                          </Label>
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={active ? 'soft' : 'outlined'}
                            color={active ? 'error' : 'primary'}
                            disabled={saving === s.id}
                            onClick={() => handleToggle(s)}
                            startIcon={
                              saving === s.id
                                ? <CircularProgress size={12} />
                                : <Iconify icon={active ? 'solar:minus-circle-bold' : 'solar:add-circle-bold'} width={14} />
                            }
                          >
                            {active ? 'Remover' : 'Adicionar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {linked.length > 0 && (
            <Box sx={{ p: 2, bgcolor: 'background.neutral', borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                {linked.length} matéria(s) na grade deste curso
              </Typography>
            </Box>
          )}
        </Card>
      )}
    </>
  );
}

// -------- Tab 3: Períodos --------

function PeriodsTab({ courses }: { courses: CourseListItem[] }) {
  const [courseId, setCourseId] = useState('');
  const [periods, setPeriods] = useState<CoursePeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; item?: CoursePeriod }>({ open: false });
  const [form, setForm] = useState({ name: '', shortName: '', weight: '', startAt: '', endAt: '' });
  const [saving, setSaving] = useState(false);
  const [seedConfirm, setSeedConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const confirmDelete = useBoolean();

  const loadPeriods = useCallback(async (cId: string) => {
    setLoading(true);
    try {
      const data = await CurriculumService.listPeriods(cId);
      setPeriods(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erro ao carregar períodos');
    } finally {
      setLoading(false);
    }
  }, []);

  const seed = async () => {
    if (saving || loading || !courseId) return;
    setSaving(true);
    try {
      const existing = await CurriculumService.listPeriods(courseId);
      const missing = missingStandardPeriods(existing);
      await missing.reduce(async (previous, payload) => { await previous; await CurriculumService.createPeriod(courseId, payload); }, Promise.resolve());
      setSeedConfirm(false); toast.success(missing.length ? 'Bimestres ausentes criados.' : 'Os quatro bimestres já estão cadastrados.');
    } catch (error: any) { toast.error(error?.message ?? 'A criação não foi concluída. Confira os períodos; uma nova tentativa consulta o que já foi criado.'); }
    finally { setSaving(false); await loadPeriods(courseId); }
  };

  const movePeriod = async (index: number, direction: number) => {
    if (saving || loading) return;
    const ordered = [...periods];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;
    [ordered[index], ordered[targetIndex]] = [ordered[targetIndex], ordered[index]];
    setSaving(true);
    try { setPeriods(await CurriculumService.reorderPeriods(courseId, ordered.map((period) => period.id))); toast.success('Ordem dos períodos atualizada.'); }
    catch { toast.error('Não foi possível alterar a ordem. A ordem anterior foi preservada.'); }
    finally { setSaving(false); }
  };

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    setPeriods([]);
    if (id) loadPeriods(id);
    else setPeriods([]);
  };

  const openCreate = () => {
    setForm({ name: '', shortName: '', weight: '', startAt: '', endAt: '' });
    setDialog({ open: true });
  };

  const openEdit = (p: CoursePeriod) => {
    setForm({
      name: p.name,
      shortName: p.shortName ?? '',
      weight: p.weight ?? '',
      startAt: p.startAt?.slice(0, 10) ?? '',
      endAt: p.endAt?.slice(0, 10) ?? '',
    });
    setDialog({ open: true, item: p });
  };

  const closeDialog = () => setDialog({ open: false });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Informe o nome'); return; }
    if (form.startAt && form.endAt && form.startAt > form.endAt) { toast.error('A data de fim deve ser igual ou posterior ao início.'); return; }
    if (form.weight !== '' && (!Number.isFinite(Number(form.weight)) || Number(form.weight) < 0)) { toast.error('Informe um peso válido, maior ou igual a zero.'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        shortName: form.shortName.trim() || undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        startAt: form.startAt || undefined,
        endAt: form.endAt || undefined,
      };
      if (dialog.item) {
        await CurriculumService.updatePeriod(courseId, dialog.item.id, payload);
        toast.success('Período atualizado');
      } else {
        await CurriculumService.createPeriod(courseId, payload);
        toast.success('Período criado');
      }
      closeDialog();
      loadPeriods(courseId);
    } catch {
      toast.error('Erro ao salvar período');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await CurriculumService.deletePeriod(courseId, id);
      toast.success('Período excluído');
      loadPeriods(courseId);
    } catch {
      toast.error('Erro ao excluir período');
    } finally {
      confirmDelete.onFalse();
      setDeleteId(null);
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" sx={{ flexShrink: 0 }}>Períodos Letivos</Typography>
          <TextField
            select
            size="small"
            label="Curso"
            disabled={loading || saving}
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="">— Selecione —</MenuItem>
            {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        </Stack>
        {courseId && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={loading || saving} onClick={() => setSeedConfirm(true)}>Criar bimestres padrão</Button>
            <Button variant="contained" disabled={loading || saving} startIcon={<Iconify icon="mingcute:add-line" />} onClick={openCreate}>Novo período</Button>
          </Stack>
        )}
      </Stack>

      {!courseId ? (
        <Card sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1}>
            <Iconify icon="solar:calendar-mark-bold-duotone" width={48} sx={{ color: 'text.disabled' }} />
            <Typography color="text.disabled">Selecione um curso para gerenciar seus períodos</Typography>
          </Stack>
        </Card>
      ) : loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
      ) : (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Ordem', 'Nome', 'Abrev.', 'Peso', 'Início', 'Fim', ''].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700, bgcolor: 'background.neutral' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.disabled' }}>
                      Nenhum período cadastrado
                    </TableCell>
                  </TableRow>
                )}
                {periods.map((p, index) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ width: 60 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Chip label={p.order} size="small" />
                        <IconButton aria-label={`Mover ${p.name} para cima`} size="small" disabled={saving || index === 0} onClick={() => movePeriod(index, -1)}><Iconify icon="solar:alt-arrow-up-bold" /></IconButton>
                        <IconButton aria-label={`Mover ${p.name} para baixo`} size="small" disabled={saving || index === periods.length - 1} onClick={() => movePeriod(index, 1)}><Iconify icon="solar:alt-arrow-down-bold" /></IconButton>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell>{p.shortName ?? '—'}</TableCell>
                    <TableCell>{p.weight ?? '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.startAt ? p.startAt.substring(0, 10) : '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.endAt ? p.endAt.substring(0, 10) : '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => openEdit(p)}>
                        <Iconify icon="solar:pen-bold" width={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setDeleteId(p.id);
                          confirmDelete.onTrue();
                        }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialog.open} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.item ? 'Editar período' : 'Novo período'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Nome *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: 1º Semestre"
                autoFocus
              />
              <TextField
                sx={{ width: 160 }}
                label="Abreviação"
                value={form.shortName}
                onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                placeholder="Ex: S1"
              />
            </Stack>
            <TextField
              label="Peso"
              type="number"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              inputProps={{ step: 0.1, min: 0 }}
              helperText="Para cálculo de média ponderada"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                label="Data de início"
                type="date"
                value={form.startAt}
                onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="Data de fim"
                type="date"
                value={form.endAt}
                onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <LoadingButton loading={saving} variant="contained" onClick={handleSave}>Salvar</LoadingButton>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={seedConfirm} onClose={() => { if (!saving) setSeedConfirm(false); }} title="Criar bimestres padrão" content="Criar os bimestres B1 a B4 que ainda não existem neste curso, com peso 25? Os períodos já cadastrados e suas notas não serão alterados." action={<LoadingButton loading={saving} variant="contained" onClick={seed}>Confirmar criação dos bimestres</LoadingButton>} />
      <ConfirmDialog
        open={confirmDelete.value}
        onClose={() => {
          confirmDelete.onFalse();
          setDeleteId(null);
        }}
        title="Excluir período"
        content="Tem certeza que deseja excluir este período?"
        action={
          <Button variant="contained" color="error" onClick={() => deleteId && handleDelete(deleteId)}>
            Excluir
          </Button>
        }
      />
    </>
  );
}

// -------- Tab 4: Config. de Notas --------

function GradeSettingTab({ courses }: { courses: CourseListItem[] }) {
  const [courseId, setCourseId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [minGrade, setMinGrade] = useState('');
  const [maxGrade, setMaxGrade] = useState('');
  const [step, setStep] = useState('');

  const loadSetting = useCallback(async (cId: string) => {
    setLoading(true);
    try {
      const data = await CurriculumService.getGradeSetting(cId);
      setMinGrade(data.minGrade != null ? String(data.minGrade) : '');
      setMaxGrade(data.maxGrade != null ? String(data.maxGrade) : '');
      setStep(data.step != null ? String(data.step) : '');
    } catch {
      setMinGrade('0');
      setMaxGrade('10');
      setStep('0.5');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCourseChange = (id: string) => {
    setCourseId(id);
    if (id) loadSetting(id);
    else { setMinGrade(''); setMaxGrade(''); setStep(''); }
  };

  const handleSave = async () => {
    if (!courseId) return;
    const values = [minGrade, maxGrade, step].map(Number);
    if ([minGrade, maxGrade, step].some((value) => value.trim() === '') || values.some((value) => !Number.isFinite(value)) || values[0] < 0 || values[0] >= values[1] || values[2] <= 0) {
      toast.error('Informe notas válidas: mínima menor que a máxima e incremento maior que zero.'); return;
    }
    setSaving(true);
    try {
      await CurriculumService.saveGradeSetting(courseId, {
        minGrade: minGrade !== '' ? Number(minGrade) : undefined,
        maxGrade: maxGrade !== '' ? Number(maxGrade) : undefined,
        step: step !== '' ? Number(step) : undefined,
      });
      toast.success('Configuração salva');
    } catch {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ flexShrink: 0 }}>Configuração de Notas</Typography>
        <TextField
          select
          size="small"
          label="Curso"
          value={courseId}
          onChange={(e) => handleCourseChange(e.target.value)}
          sx={{ minWidth: 260 }}
        >
          <MenuItem value="">— Selecione —</MenuItem>
          {courses.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
      </Stack>

      {!courseId ? (
        <Card sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1}>
            <Iconify icon="solar:chart-bold-duotone" width={48} sx={{ color: 'text.disabled' }} />
            <Typography color="text.disabled">Selecione um curso para configurar as notas</Typography>
          </Stack>
        </Card>
      ) : loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
      ) : (
        <Card sx={{ p: 3, maxWidth: 480 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Parâmetros de avaliação
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Nota mínima da escala"
              type="number"
              value={minGrade}
              onChange={(e) => setMinGrade(e.target.value)}
              inputProps={{ step: 0.1, min: 0 }}
              helperText="Menor nota permitida. Este campo não define a média de aprovação."
            />
            <TextField
              fullWidth
              label="Nota máxima"
              type="number"
              value={maxGrade}
              onChange={(e) => setMaxGrade(e.target.value)}
              inputProps={{ step: 0.1, min: 0 }}
              helperText="Valor máximo que pode ser atribuído"
            />
            <TextField
              fullWidth
              label="Incremento (step)"
              type="number"
              value={step}
              onChange={(e) => setStep(e.target.value)}
              inputProps={{ step: 0.1, min: 0.1 }}
              helperText="Ex: 0.5 → notas como 7.0, 7.5, 8.0"
            />
            <Divider />
            {minGrade && maxGrade && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label={`Mín: ${minGrade}`} size="small" color="error" variant="soft" />
                <Chip label={`Máx: ${maxGrade}`} size="small" color="success" variant="soft" />
                {step && <Chip label={`Step: ${step}`} size="small" variant="soft" />}
              </Stack>
            )}
            <LoadingButton loading={saving} variant="contained" onClick={handleSave} sx={{ alignSelf: 'flex-start' }}>
              Salvar configuração
            </LoadingButton>
          </Stack>
        </Card>
      )}
    </>
  );
}

// ── View principal ────────────────────────────────────────────────────────

export function CurriculumView() {
  const schoolId = useSchoolId();
  const [tab, setTab] = useState(0);
  const [coursesError, setCoursesError] = useState(false);
  const [courses, setCourses] = useState<CourseListItem[]>([]);

  useEffect(() => {
    CourseService.list({ hasPagination: false })
      .then((res) => setCourses((res as any).courses ?? []))
      .catch(() => setCoursesError(true));
  }, []);

  const tabs = [
    { label: 'Matérias', icon: 'solar:book-bold-duotone' },
    { label: 'Grade por Curso', icon: 'solar:layers-bold-duotone' },
    { label: 'Períodos', icon: 'solar:calendar-date-bold-duotone' },
    { label: 'Config. de Notas', icon: 'solar:chart-2-bold-duotone' },
    { label: 'Grupos de matérias', icon: 'solar:layers-bold-duotone' },
  ];

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Grade Curricular"
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Grade Curricular' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {coursesError && <Alert severity="error" sx={{ mb: 3 }}>Não foi possível carregar os cursos. Atualize a página para continuar.</Alert>}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2.5,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 rgba(${theme.vars?.palette?.grey?.['500Channel'] ?? '145,158,171'}, 0.08)`,
          }}
        >
          {tabs.map((t, i) => (
            <Tab
              key={t.label}
              value={i}
              label={t.label}
              icon={<Iconify icon={t.icon} width={20} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Card>

      <Box key={schoolId}>
        {tab === 0 && <SubjectsTab schoolId={schoolId} />}
        {tab === 1 && <CourseSubjectsTab schoolId={schoolId} courses={courses} />}
        {tab === 2 && <PeriodsTab courses={courses} />}
        {tab === 3 && <GradeSettingTab courses={courses} />}
        {tab === 4 && <SubjectGroupsTab courses={courses} />}
      </Box>
    </DashboardContent>
  );
}
