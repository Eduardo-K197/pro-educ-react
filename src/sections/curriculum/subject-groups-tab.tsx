'use client';

import type { CourseListItem } from 'src/types/services/course';
import type { Subject, SubjectGroup } from 'src/types/services/curriculum';

import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { CurriculumService } from 'src/services/curriculum';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

export function SubjectGroupsTab({ courses }: { courses: CourseListItem[] }) {
  const [courseId, setCourseId] = useState('');
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ item?: SubjectGroup } | null>(null);
  const [name, setName] = useState('');
  const [association, setAssociation] = useState<SubjectGroup | null>(null);
  const [linkedSubjects, setLinkedSubjects] = useState<Subject[]>([]);
  const [courseSubjects, setCourseSubjects] = useState<Subject[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [loadingAssociation, setLoadingAssociation] = useState(false);
  const [associationError, setAssociationError] = useState(false);
  const [target, setTarget] = useState<SubjectGroup | null>(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true); setError(false);
    try { setGroups(await CurriculumService.listSubjectGroups(courseId)); }
    catch { setGroups([]); setError(true); }
    finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!association) return undefined;
    let active = true; setSubjectIds([]); setLoadingAssociation(true); setAssociationError(false); setLinkedSubjects([]); setCourseSubjects([]);
    Promise.all([CurriculumService.getSubjectGroup(courseId, association.id), CurriculumService.listCourseSubjects(courseId)]).then(([group, course]) => {
      if (active) { setLinkedSubjects(group.subjects ?? []); setCourseSubjects(course.subjects ?? []); }
    }).catch(() => { if (active) setAssociationError(true); }).finally(() => { if (active) setLoadingAssociation(false); });
    return () => { active = false; };
  }, [association, courseId]);
  const associate = async () => {
    if (!association || saving || loadingAssociation || associationError || !subjectIds.length) return;
    if (subjectIds.some((id) => !courseSubjects.some((subject) => subject.id === id))) return;
    setSaving(true);
    try { await CurriculumService.addSubjectsToGroup(courseId, association.id, subjectIds); setAssociation(null); toast.success('Matérias adicionadas ao grupo.'); }
    catch { toast.error('Não foi possível adicionar as matérias. Confira os vínculos antes de tentar novamente.'); }
    finally { setSaving(false); }
  };

  const save = async () => {
    if (!name.trim() || !courseId || saving || !dialog) return;
    setSaving(true);
    try {
      if (dialog.item) await CurriculumService.updateSubjectGroup(courseId, dialog.item.id, name.trim());
      else await CurriculumService.createSubjectGroup(courseId, name.trim());
      setDialog(null); toast.success('Grupo salvo.'); await load();
    } catch { toast.error('Não foi possível salvar o grupo. Seus dados foram preservados.'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!target || saving) return;
    setSaving(true);
    try {
      await CurriculumService.deleteSubjectGroup(courseId, target.id);
      setTarget(null); toast.success('Grupo excluído.'); await load();
    } catch { toast.error('Não foi possível excluir o grupo.'); }
    finally { setSaving(false); }
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField select label="Curso" value={courseId} disabled={loading || saving || !!association || !!dialog || !!target} sx={{ minWidth: { sm: 280 } }}
          onChange={(event) => { setGroups([]); setCourseId(event.target.value); }}>
          <MenuItem value="">Selecione o curso</MenuItem>
          {courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
        </TextField>
        <Button variant="contained" disabled={!courseId || loading || error} onClick={() => { setName(''); setDialog({}); }}>Novo grupo</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">Organize as matérias em grupos, como Linguagens e Ciências da Natureza.</Typography>
      {error && <Alert severity="error" action={<Button color="inherit" onClick={load}>Tentar novamente</Button>}>Não foi possível carregar os grupos deste curso.</Alert>}
      <Card sx={{ p: 3 }}>
        {!courseId ? <Typography>Selecione um curso para gerenciar seus grupos de matérias.</Typography>
          : loading ? <Typography role="status">Carregando grupos…</Typography>
          : !error && groups.length === 0 ? <Typography color="text.secondary">Nenhum grupo cadastrado. Crie o primeiro grupo para organizar a grade.</Typography>
          : groups.map((group) => (
            <Stack key={group.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" sx={{ py: 1.5 }}>
              <Typography variant="subtitle2">{group.name}</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={() => setAssociation(group)}>Matérias do grupo</Button>
                <Button size="small" onClick={() => { setName(group.name); setDialog({ item: group }); }}>Renomear</Button>
                <Button size="small" color="error" onClick={() => setTarget(group)}>Excluir</Button>
              </Stack>
            </Stack>
          ))}
      </Card>
      <Dialog open={!!dialog} onClose={() => { if (!saving) setDialog(null); }} fullWidth maxWidth="xs">
        <DialogTitle>{dialog?.item ? 'Renomear grupo' : 'Novo grupo de matérias'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth required label="Nome do grupo" value={name} sx={{ mt: 1 }} onChange={(event) => setName(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setDialog(null)}>Cancelar</Button>
          <LoadingButton loading={saving} disabled={!name.trim()} variant="contained" onClick={save}>Salvar grupo</LoadingButton>
        </DialogActions>
      </Dialog>
      <Dialog open={!!association} onClose={() => { if (!saving) setAssociation(null); }} fullWidth maxWidth="sm">
        <DialogTitle>Matérias do grupo — {association?.name}</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
          {loadingAssociation ? <Typography role="status">Carregando matérias do grupo…</Typography> : associationError ? <Alert severity="error">Não foi possível carregar os vínculos. Feche e abra a janela para tentar novamente.</Alert> : <>
            <Typography variant="body2">Vinculadas: {linkedSubjects.map((subject) => subject.name).join(', ') || 'nenhuma matéria'}.</Typography>
            <TextField select label="Matérias para adicionar" value={subjectIds} SelectProps={{ multiple: true, renderValue: (value) => courseSubjects.filter((subject) => (value as string[]).includes(subject.id)).map((subject) => subject.name).join(', ') }} onChange={(event) => setSubjectIds(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)} disabled={saving}>
              {courseSubjects.filter((subject) => !linkedSubjects.some((linked) => linked.id === subject.id)).map((subject) => <MenuItem key={subject.id} value={subject.id}><Checkbox checked={subjectIds.includes(subject.id)} />{subject.name}</MenuItem>)}
            </TextField>
            <Typography variant="caption" color="text.secondary">Somente matérias já vinculadas ao curso podem ser adicionadas. Os vínculos existentes serão preservados.</Typography>
          </>}
        </Stack></DialogContent><DialogActions><Button disabled={saving} onClick={() => setAssociation(null)}>Fechar</Button><LoadingButton loading={saving} disabled={loadingAssociation || associationError || !subjectIds.length} variant="contained" onClick={associate}>Adicionar matérias</LoadingButton></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!target} onClose={() => { if (!saving) setTarget(null); }} title="Excluir grupo de matérias"
        content={`Deseja excluir o grupo “${target?.name ?? ''}”? Confira os vínculos da grade antes de continuar.`}
        action={<LoadingButton loading={saving} color="error" variant="contained" onClick={remove}>Excluir grupo</LoadingButton>} />
    </Stack>
  );
}
