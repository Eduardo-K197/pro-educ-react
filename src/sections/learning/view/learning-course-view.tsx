'use client';

import type { LessonInput , ModuleInput, LearningLesson, LearningModule, LearningCourseTree, LearningMediaConfig } from 'src/services/learning';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { putDirect, fileContentType } from 'src/utils/direct-upload';

import { DashboardContent } from 'src/layouts/dashboard';
import { LearningService, LearningVideoApi } from 'src/services/learning';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { LearningProgressTab } from '../learning-progress-tab';
import { LearningModuleDialog } from '../learning-module-dialog';
import { LearningLessonDialog } from '../learning-lesson-dialog';
import { LearningAssessmentsTab } from '../learning-assessments-tab';
import { LearningVideoUploadDialog } from '../learning-video-upload-dialog';
import { moveItem, fDuration, LESSON_TYPE_ICON, LESSON_TYPE_LABEL } from '../utils';

// ----------------------------------------------------------------------

const VIDEO_STATUS: Record<string, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  uploading: { label: 'Enviando', color: 'info' },
  processing: { label: 'Processando', color: 'info' },
  ready: { label: 'Vídeo pronto', color: 'success' },
  failed: { label: 'Falha no vídeo', color: 'error' },
};

type Confirm = { title: string; content: string; action: () => Promise<void> } | null;

const errorMessage = (err: any, fallback: string) => err?.message || fallback;

export function LearningCourseView({ id }: { id: string }) {
  const [tree, setTree] = useState<LearningCourseTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'content' | 'assessments' | 'progress'>('content');
  const [media, setMedia] = useState<LearningMediaConfig | null>(null);
  const [uploadLesson, setUploadLesson] = useState<LearningLesson | null>(null);

  useEffect(() => {
    // Sem Bunny configurado na API, a opção de upload nem aparece.
    LearningVideoApi.config()
      .then(setMedia)
      .catch(() => setMedia(null));
  }, []);

  const [moduleDialog, setModuleDialog] = useState<{ open: boolean; module: LearningModule | null }>({ open: false, module: null });
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; moduleId: string; lesson: LearningLesson | null }>({
    open: false,
    moduleId: '',
    lesson: null,
  });
  const [confirm, setConfirm] = useState<Confirm>(null);

  const load = useCallback(async () => {
    try {
      setTree(await LearningService.course(id));
    } catch (err) {
      toast.error(errorMessage(err, 'Erro ao carregar o curso'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, success?: string) => {
    try {
      await fn();
      if (success) toast.success(success);
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível salvar'));
      throw err;
    } finally {
      await load();
    }
  };

  // ---------------------------------------------------------------- módulos

  const saveModule = async (input: ModuleInput) => {
    const current = moduleDialog.module;
    await run(
      () => (current ? LearningService.updateModule(current.id, input) : LearningService.createModule(id, input)),
      current ? 'Módulo atualizado' : 'Módulo criado'
    );
  };

  const moveModule = (index: number, delta: -1 | 1) => {
    if (!tree) return;
    const next = moveItem(tree.modules, index, delta);
    if (next) run(() => LearningService.reorderModules(id, next.map((m) => m.id))).catch(() => {});
  };

  // ---------------------------------------------------------------- aulas

  const saveLesson = async (input: LessonInput, file: File | null) => {
    const { lesson, moduleId } = lessonDialog;
    const wantPublish = !!input.published;
    // Aula de arquivo só pode ser publicada depois do upload.
    const firstSave = file && !lesson?.file ? { ...input, published: false } : input;
    await run(async () => {
      let saved = lesson ? await LearningService.updateLesson(lesson.id, firstSave) : await LearningService.createLesson(moduleId, firstSave);
      if (file) {
        if (media?.directFiles) {
          // R2/S3: o arquivo vai direto do navegador para o bucket (PUT pré-assinado).
          const ticket = await LearningVideoApi.requestUpload(saved.id, 'file', { fileName: file.name, contentType: fileContentType(file), size: file.size });
          await putDirect(ticket.uploadUrl, file, ticket.headers);
          saved = await LearningVideoApi.confirmUpload(saved.id, 'file', { key: ticket.key, fileName: file.name });
        } else {
          saved = await LearningService.uploadLessonFile(saved.id, file);
        }
        if (wantPublish && !saved.published) await LearningService.updateLesson(saved.id, { published: true });
      }
    }, lesson ? 'Aula atualizada' : 'Aula criada');
  };

  const moveLesson = (module: LearningModule, index: number, delta: -1 | 1) => {
    const next = moveItem(module.lessons, index, delta);
    if (next) run(() => LearningService.reorderLessons(module.id, next.map((l) => l.id))).catch(() => {});
  };

  const refreshVideo = (lesson: LearningLesson) =>
    run(() => LearningVideoApi.refresh(lesson.id), 'Status do vídeo atualizado').catch(() => {});

  const openFile = async (lesson: LearningLesson) => {
    try {
      const { url } = await LearningService.lessonFileUrl(lesson.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error(errorMessage(err, 'Não foi possível abrir o arquivo'));
    }
  };

  if (loading) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tree) {
    return (
      <DashboardContent>
        <EmptyContent filled title="Curso não encontrado" sx={{ py: 10 }} />
      </DashboardContent>
    );
  }

  const { canEdit } = tree;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tree.course.name}
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Learning', href: paths.dashboard.learning.root },
          { name: tree.course.name },
        ]}
        action={
          canEdit && tab === 'content' ? (
            <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setModuleDialog({ open: true, module: null })}>
              Novo módulo
            </Button>
          ) : null
        }
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="content" label="Conteúdo" />
        <Tab value="assessments" label="Avaliações" />
        <Tab value="progress" label="Progresso por turma" />
      </Tabs>

      {tab === 'progress' && <LearningProgressTab classrooms={tree.classrooms} />}
      {tab === 'assessments' && <LearningAssessmentsTab courseId={id} />}

      {tab === 'content' && !tree.modules.length && (
        <EmptyContent filled title="Nenhum módulo ainda" description={canEdit ? 'Crie o primeiro módulo do curso.' : undefined} sx={{ py: 10 }} />
      )}

      {tab === 'content' && (
        <Stack spacing={3}>
          {tree.modules.map((module, mIndex) => (
            <Card key={module.id}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pl: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1">
                      {mIndex + 1}. {module.title}
                    </Typography>
                    <Label color={module.published ? 'success' : 'default'}>{module.published ? 'Publicado' : 'Rascunho'}</Label>
                  </Stack>
                  {module.description && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {module.description}
                    </Typography>
                  )}
                </Box>
                {canEdit && (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Subir">
                      <span>
                        <IconButton size="small" disabled={mIndex === 0} onClick={() => moveModule(mIndex, -1)}>
                          <Iconify icon="eva:arrow-upward-fill" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Descer">
                      <span>
                        <IconButton size="small" disabled={mIndex === tree.modules.length - 1} onClick={() => moveModule(mIndex, 1)}>
                          <Iconify icon="eva:arrow-downward-fill" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={module.published ? 'Despublicar' : 'Publicar'}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          run(() => LearningService.updateModule(module.id, { published: !module.published }), module.published ? 'Módulo despublicado' : 'Módulo publicado').catch(() => {})
                        }
                      >
                        <Iconify icon={module.published ? 'solar:eye-closed-bold' : 'solar:eye-bold'} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => setModuleDialog({ open: true, module })}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setConfirm({
                            title: 'Excluir módulo',
                            content: `Excluir "${module.title}" e todas as suas aulas?`,
                            action: () => run(() => LearningService.deleteModule(module.id), 'Módulo excluído'),
                          })
                        }
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
              <Divider />

              {!module.lessons.length && (
                <Typography variant="body2" sx={{ p: 3, color: 'text.secondary' }}>
                  Nenhuma aula neste módulo.
                </Typography>
              )}

              {module.lessons.map((lesson, lIndex) => (
                <Stack
                  key={lesson.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ px: 3, py: 1.5, flexWrap: 'wrap', '&:not(:last-of-type)': { borderBottom: (t) => `dashed 1px ${t.vars.palette.divider}` } }}
                >
                  <Iconify icon={LESSON_TYPE_ICON[lesson.type]} width={24} sx={{ color: 'primary.main' }} />
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {lIndex + 1}. {lesson.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {LESSON_TYPE_LABEL[lesson.type]}
                      {lesson.durationSec ? ` · ${fDuration(lesson.durationSec)}` : ''}
                      {lesson.required ? ' · obrigatória' : ' · opcional'}
                      {lesson.file ? ` · ${lesson.file.name}` : ''}
                      {lesson.videoProvider === 'bunny' ? ' · Bunny Stream' : ''}
                      {lesson.videoProvider === 'storage' ? ' · MP4 próprio' : ''}
                    </Typography>
                  </Box>
                  {lesson.videoProvider === 'bunny' && (
                    <Label color={VIDEO_STATUS[lesson.videoStatus ?? '']?.color ?? 'default'}>
                      {VIDEO_STATUS[lesson.videoStatus ?? '']?.label ?? 'Processando'}
                    </Label>
                  )}
                  {canEdit && lesson.videoProvider === 'bunny' && lesson.videoStatus !== 'ready' && (
                    <Tooltip title="Atualizar status do vídeo">
                      <IconButton size="small" onClick={() => refreshVideo(lesson)}>
                        <Iconify icon="solar:refresh-bold" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canEdit && (media?.bunny || media?.storage) && lesson.type === 'video' && (
                    <Tooltip title="Enviar vídeo próprio">
                      <IconButton size="small" onClick={() => setUploadLesson(lesson)}>
                        <Iconify icon="eva:cloud-upload-fill" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Label color={lesson.published ? 'success' : 'default'}>{lesson.published ? 'Publicada' : 'Rascunho'}</Label>
                  {lesson.file && (
                    <Tooltip title="Abrir arquivo">
                      <IconButton size="small" onClick={() => openFile(lesson)}>
                        <Iconify icon="solar:download-minimalistic-bold" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {canEdit && (
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" disabled={lIndex === 0} onClick={() => moveLesson(module, lIndex, -1)}>
                        <Iconify icon="eva:arrow-upward-fill" />
                      </IconButton>
                      <IconButton size="small" disabled={lIndex === module.lessons.length - 1} onClick={() => moveLesson(module, lIndex, 1)}>
                        <Iconify icon="eva:arrow-downward-fill" />
                      </IconButton>
                      <Tooltip title={lesson.published ? 'Despublicar' : 'Publicar'}>
                        <IconButton
                          size="small"
                          onClick={() =>
                            run(() => LearningService.updateLesson(lesson.id, { published: !lesson.published }), lesson.published ? 'Aula despublicada' : 'Aula publicada').catch(() => {})
                          }
                        >
                          <Iconify icon={lesson.published ? 'solar:eye-closed-bold' : 'solar:eye-bold'} />
                        </IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={() => setLessonDialog({ open: true, moduleId: module.id, lesson })}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setConfirm({
                            title: 'Excluir aula',
                            content: `Excluir a aula "${lesson.title}"?`,
                            action: () => run(() => LearningService.deleteLesson(lesson.id), 'Aula excluída'),
                          })
                        }
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  )}
                </Stack>
              ))}

              {canEdit && (
                <Box sx={{ p: 2, pl: 3 }}>
                  <Button size="small" startIcon={<Iconify icon="mingcute:add-line" />} onClick={() => setLessonDialog({ open: true, moduleId: module.id, lesson: null })}>
                    Nova aula
                  </Button>
                </Box>
              )}
            </Card>
          ))}
        </Stack>
      )}

      <LearningModuleDialog
        open={moduleDialog.open}
        module={moduleDialog.module}
        onClose={() => setModuleDialog({ open: false, module: null })}
        onSubmit={saveModule}
      />

      <LearningVideoUploadDialog
        lesson={uploadLesson}
        onClose={() => setUploadLesson(null)}
        config={media}
        onDone={(target) => {
          toast.success(
            target === 'storage'
              ? 'Vídeo enviado e já disponível para os alunos.'
              : 'Vídeo enviado. Ele aparece para os alunos assim que terminar o processamento.'
          );
          load();
        }}
      />

      <LearningLessonDialog
        open={lessonDialog.open}
        lesson={lessonDialog.lesson}
        onClose={() => setLessonDialog({ open: false, moduleId: '', lesson: null })}
        onSubmit={saveLesson}
      />

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.title}
        content={confirm?.content}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              const action = confirm?.action;
              setConfirm(null);
              await action?.().catch(() => {});
            }}
          >
            Excluir
          </Button>
        }
      />
    </DashboardContent>
  );
}
