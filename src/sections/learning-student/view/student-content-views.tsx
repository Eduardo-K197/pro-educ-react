'use client';

import type { MyLesson, MyCourse, MyCourseDetail } from 'src/services/learning-student';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CardActionArea from '@mui/material/CardActionArea';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { StudentLearningApi } from 'src/services/learning-student';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { useStudentSession } from '../student-session';
import { StudentProgressBar } from '../student-progress-bar';
import { fBytes, fDuration, LESSON_TYPE_ICON } from '../../learning/utils';

// ----------------------------------------------------------------------

function useLoad<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    return loader()
      .then(setData)
      .catch((err) => setError(err?.response?.status === 404 ? 'Conteúdo não encontrado ou sem acesso.' : err?.message || 'Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [loader]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, setData };
}

const Loading = () => (
  <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
    <CircularProgress />
  </Box>
);

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Button component={RouterLink} href={href} size="small" startIcon={<Iconify icon="eva:arrow-ios-back-fill" />} sx={{ mb: 1.5, ml: -1 }}>
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------- meus cursos

export function StudentCoursesView() {
  const { me } = useStudentSession();
  const { data: courses, error, loading } = useLoad<MyCourse[]>(StudentLearningApi.courses);

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4">Olá, {me?.student.name.split(' ')[0]}!</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Seus cursos
        </Typography>
      </Box>

      {loading && <Loading />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && !courses?.length && (
        <EmptyContent filled title="Nenhum curso disponível" description="Os cursos aparecem aqui enquanto a matrícula estiver ativa." sx={{ py: 8 }} />
      )}

      {courses?.map((c) => (
        <Card key={c.id}>
          <CardActionArea component={RouterLink} href={paths.student.course(c.id)} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6">{c.name}</Typography>
            {c.classroomName && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Turma {c.classroomName}
              </Typography>
            )}
            <Box sx={{ mt: 1.5 }}>
              <StudentProgressBar percent={c.percent} completed={c.completedLessons} total={c.totalLessons} dense />
            </Box>
          </CardActionArea>
        </Card>
      ))}
    </Stack>
  );
}

// ---------------------------------------------------------------- curso → módulos

export function StudentCourseView({ id }: { id: string }) {
  const loader = useCallback(() => StudentLearningApi.course(id), [id]);
  const { data, error, loading } = useLoad<MyCourseDetail>(loader);

  if (loading) return <Loading />;
  if (error || !data) {
    return (
      <>
        <BackLink href={paths.student.root} label="Meus cursos" />
        <Alert severity="warning">{error || 'Curso não encontrado.'}</Alert>
      </>
    );
  }

  const nextModuleId = data.modules.find((m) => m.lessons.some((l) => l.id === data.nextLessonId))?.id;

  return (
    <Stack spacing={2.5}>
      <Box>
        <BackLink href={paths.student.root} label="Meus cursos" />
        <Typography variant="h4">{data.course.name}</Typography>
        {data.course.description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {data.course.description}
          </Typography>
        )}
      </Box>

      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <StudentProgressBar percent={data.percent} completed={data.completedLessons} total={data.totalLessons} />
        {data.nextLessonId && (
          <Button
            component={RouterLink}
            href={paths.student.lesson(data.nextLessonId)}
            variant="contained"
            size="large"
            fullWidth
            startIcon={<Iconify icon="solar:play-bold" />}
            sx={{ mt: 2 }}
          >
            {data.completedLessons ? 'Continuar de onde parei' : 'Começar o curso'}
          </Button>
        )}
        {!data.nextLessonId && data.totalLessons > 0 && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Parabéns! Você concluiu todas as aulas publicadas.
          </Alert>
        )}
      </Card>

      {!data.modules.length && <EmptyContent filled title="O conteúdo deste curso ainda não foi publicado" sx={{ py: 6 }} />}

      <Box>
        {data.modules.map((m, i) => (
          <Accordion key={m.id} defaultExpanded={m.id === nextModuleId || (!nextModuleId && i === 0)} disableGutters>
            <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
              <Stack sx={{ flex: 1, pr: 1 }}>
                <Typography variant="subtitle1">
                  {i + 1}. {m.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {m.completedLessons}/{m.totalLessons} aulas
                </Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 1 }}>
              {m.description && (
                <Typography variant="body2" sx={{ color: 'text.secondary', px: 1, mb: 1 }}>
                  {m.description}
                </Typography>
              )}
              {m.lessons.map((l) => (
                <Button
                  key={l.id}
                  component={RouterLink}
                  href={paths.student.lesson(l.id)}
                  color="inherit"
                  fullWidth
                  sx={{ justifyContent: 'flex-start', textAlign: 'left', py: 1.25, fontWeight: 400 }}
                  startIcon={
                    <Iconify
                      icon={l.completed ? 'eva:checkmark-circle-2-fill' : LESSON_TYPE_ICON[l.type]}
                      sx={{ color: l.completed ? 'success.main' : 'text.secondary' }}
                    />
                  }
                >
                  <Box sx={{ flex: 1 }}>{l.title}</Box>
                  {l.durationSec ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1, whiteSpace: 'nowrap' }}>
                      {fDuration(l.durationSec)}
                    </Typography>
                  ) : null}
                </Button>
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Stack>
  );
}

// ---------------------------------------------------------------- aula

export function StudentLessonView({ id }: { id: string }) {
  const router = useRouter();
  const loader = useCallback(() => StudentLearningApi.lesson(id), [id]);
  const { data: lesson, error, loading, setData } = useLoad<MyLesson>(loader);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }, [id]);

  if (loading) return <Loading />;
  if (error || !lesson) {
    return (
      <>
        <BackLink href={paths.student.root} label="Meus cursos" />
        <Alert severity="warning">{error || 'Aula não encontrada.'}</Alert>
      </>
    );
  }

  const complete = async (goNext: boolean) => {
    setCompleting(true);
    try {
      const result = await StudentLearningApi.complete(lesson.id);
      setData({ ...lesson, completed: true, completedLessons: result.completedLessons, percent: result.percent, totalLessons: result.totalLessons });
      if (goNext && result.nextLessonId) router.push(paths.student.lesson(result.nextLessonId));
      else if (!result.nextLessonId) toast.success(result.percent === 100 ? 'Curso concluído!' : 'Aula concluída!');
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível concluir a aula');
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Box>
        <BackLink href={paths.student.course(lesson.course.id)} label={lesson.course.name} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {lesson.module.title} · Aula {lesson.position} de {lesson.totalLessons}
        </Typography>
        <Typography variant="h5">{lesson.title}</Typography>
      </Box>

      {lesson.type === 'video' && lesson.embedUrl && (
        <Box sx={{ position: 'relative', width: 1, pt: '56.25%', borderRadius: 1.5, overflow: 'hidden', bgcolor: 'common.black' }}>
          <Box
            component="iframe"
            src={lesson.embedUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            sx={{ position: 'absolute', inset: 0, width: 1, height: 1, border: 0 }}
          />
        </Box>
      )}

      {lesson.file && (
        <Card sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Iconify icon="solar:file-text-bold-duotone" width={32} sx={{ color: 'primary.main', flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {lesson.file.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {fBytes(lesson.file.size)}
              </Typography>
            </Box>
            <Button variant="contained" href={lesson.file.url} target="_blank" rel="noopener" startIcon={<Iconify icon="solar:download-minimalistic-bold" />}>
              Baixar
            </Button>
          </Stack>
        </Card>
      )}

      {lesson.body && (
        <Card sx={{ p: { xs: 2, sm: 3 } }}>
          {/* HTML sanitizado no servidor (lista de permissões) */}
          <Box
            sx={{ '& img': { maxWidth: 1, height: 'auto' }, '& p': { my: 1 }, overflowWrap: 'anywhere', typography: 'body1' }}
            dangerouslySetInnerHTML={{ __html: lesson.body }}
          />
        </Card>
      )}

      <Card sx={{ p: { xs: 2, sm: 3 } }}>
        <StudentProgressBar percent={lesson.percent} completed={lesson.completedLessons} total={lesson.totalLessons} dense />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
          {lesson.completed ? (
            <Button variant="soft" color="success" disabled startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />} sx={{ flex: 1 }}>
              Aula concluída
            </Button>
          ) : (
            <LoadingButton
              variant="contained"
              color="success"
              size="large"
              loading={completing}
              onClick={() => complete(false)}
              startIcon={<Iconify icon="eva:checkmark-fill" />}
              sx={{ flex: 1 }}
            >
              Concluir aula
            </LoadingButton>
          )}
          {lesson.nextLessonId && (
            <LoadingButton
              variant="outlined"
              size="large"
              loading={completing}
              onClick={() => (lesson.completed ? router.push(paths.student.lesson(lesson.nextLessonId!)) : complete(true))}
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
              sx={{ flex: 1 }}
            >
              {lesson.completed ? 'Próxima aula' : 'Concluir e ir para a próxima'}
            </LoadingButton>
          )}
        </Stack>
        {lesson.previousLessonId && (
          <Button component={RouterLink} href={paths.student.lesson(lesson.previousLessonId)} size="small" sx={{ mt: 1.5 }} startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}>
            Aula anterior
          </Button>
        )}
      </Card>
    </Stack>
  );
}
