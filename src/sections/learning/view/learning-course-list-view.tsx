'use client';

import type { LearningCourseSummary } from 'src/services/learning';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { LearningService } from 'src/services/learning';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function LearningCourseListView() {
  const [courses, setCourses] = useState<LearningCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    LearningService.courses()
      .then(setCourses)
      .catch((err) => toast.error(err?.message || 'Erro ao carregar os cursos'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="ProEduc Learning"
        description="Monte o conteúdo EAD dos cursos: módulos, videoaulas, textos e materiais para download."
        links={[{ name: 'Painel', href: paths.dashboard.root }, { name: 'Learning' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {loading && (
        <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && !courses.length && (
        <EmptyContent filled title="Nenhum curso disponível" description="Professores veem só os cursos em que lecionam." sx={{ py: 10 }} />
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
        }}
      >
        {courses.map((c) => (
          <Card key={c.id} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Typography variant="h6" sx={{ flex: 1 }}>
                {c.name}
              </Typography>
              {!c.canEdit && <Label color="default">Leitura</Label>}
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
              {c.publishedModuleCount}/{c.moduleCount} módulos publicados · {c.publishedLessonCount}/{c.lessonCount} aulas publicadas
            </Typography>
            <Button
              component={RouterLink}
              href={paths.dashboard.learning.course(c.id)}
              variant="outlined"
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {c.canEdit ? 'Editar conteúdo' : 'Ver conteúdo'}
            </Button>
          </Card>
        ))}
      </Box>
    </DashboardContent>
  );
}
