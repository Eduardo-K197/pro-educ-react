'use client';

import { useState, useEffect, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import type { LessonDetail } from 'src/types/services/lesson';
import { LessonService } from 'src/services/lesson';

import { LessonNewEditForm } from '../lesson-new-edit-form';
import { LessonChamadaTab } from '../lesson-chamada-tab';

// ----------------------------------------------------------------------

const STATUS_COLOR: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  completed: 'success',
  scheduled: 'warning',
  cancelled: 'error',
};

type Props = { id: string };

export function LessonDetailView({ id }: Props) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    LessonService.getById(id)
      .then(setLesson)
      .catch(() => toast.error('Erro ao carregar aula'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '50vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  if (!lesson) return null;

  const statusColor = STATUS_COLOR[lesson.status ?? ''] ?? 'default';
  const heading = lesson.details || `Aula — ${lesson.classroom?.name ?? ''}`;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={heading}
        links={[
          { name: 'Painel', href: paths.dashboard.root },
          { name: 'Aulas', href: paths.dashboard.lessons.root },
          { name: heading },
        ]}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            {lesson.status && (
              <Chip
                label={lesson.status}
                size="small"
                color={statusColor}
                variant="soft"
              />
            )}
            <Button
              component={RouterLink}
              href={paths.dashboard.lessons.edit(id)}
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              Editar
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Dados da aula" />
        <Tab
          label="Chamada"
          icon={
            lesson.presences && lesson.presences.length > 0 ? (
              <Chip
                label={lesson.presences.length}
                size="small"
                color="success"
                sx={{ height: 18, fontSize: 11 }}
              />
            ) : undefined
          }
          iconPosition="end"
        />
      </Tabs>

      {activeTab === 0 && <LessonNewEditForm currentLesson={lesson} />}

      {activeTab === 1 && (
        <LessonChamadaTab lesson={lesson} onSaved={load} />
      )}
    </DashboardContent>
  );
}
