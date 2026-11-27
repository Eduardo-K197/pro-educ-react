'use client';

import type { QueueItem } from 'src/services/learning';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { LearningAssessmentApi } from 'src/services/learning';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

/** Fila de correção: tentativas com dissertativas pendentes nos cursos do professor. */
export function LearningGradingQueueView() {
  const [items, setItems] = useState<QueueItem[] | null>(null);

  useEffect(() => {
    LearningAssessmentApi.queue()
      .then(setItems)
      .catch((err) => {
        toast.error(err?.message || 'Erro ao carregar a fila');
        setItems([]);
      });
  }, []);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Fila de correção"
        description="Provas enviadas com questões dissertativas aguardando nota."
        links={[{ name: 'Learning', href: paths.dashboard.learning.root }, { name: 'Correção' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />
      {!items && (
        <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}
      {items && !items.length && <EmptyContent filled title="Nada para corrigir" sx={{ py: 10 }} />}
      <Stack spacing={1.5}>
        {items?.map((it) => (
          <Card key={it.id}>
            <CardActionArea component={RouterLink} href={paths.dashboard.learning.attempt(it.id)} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Iconify icon="solar:document-text-bold-duotone" width={28} sx={{ color: 'warning.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2">
                    {it.studentName} — {it.assessmentTitle}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {it.courseName} · tentativa {it.number}
                    {it.submittedAt ? ` · enviada em ${fDateTime(it.submittedAt, 'DD/MM/YYYY HH:mm')}` : ''}
                  </Typography>
                </Box>
                <Iconify icon="eva:arrow-ios-forward-fill" />
              </Stack>
            </CardActionArea>
          </Card>
        ))}
      </Stack>
    </DashboardContent>
  );
}
