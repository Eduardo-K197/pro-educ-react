'use client';

import type { ClassroomProgress } from 'src/services/learning';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { LearningService } from 'src/services/learning';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

/** Progresso por turma: aluno × aulas publicadas concluídas. */
export function LearningProgressTab({ classrooms }: { classrooms: { id: string; name: string }[] }) {
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id ?? '');
  const [data, setData] = useState<ClassroomProgress | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classroomId) return undefined;
    let cancelled = false;
    setLoading(true);
    LearningService.classroomProgress(classroomId)
      .then((res) => !cancelled && setData(res))
      .catch((err) => toast.error(err?.message || 'Erro ao carregar o progresso'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  if (!classrooms.length) {
    return <EmptyContent filled title="Nenhuma turma neste curso" sx={{ py: 8 }} />;
  }

  return (
    <Stack spacing={2}>
      <TextField select label="Turma" value={classroomId} onChange={(e) => setClassroomId(e.target.value)} sx={{ maxWidth: 360 }}>
        {classrooms.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </TextField>

      {loading && (
        <Box sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && data && (
        <Card>
          {!data.students.length || !data.lessons.length ? (
            <EmptyContent
              title={!data.students.length ? 'Nenhum aluno matriculado nesta turma' : 'Nenhuma aula publicada ainda'}
              sx={{ py: 8 }}
            />
          ) : (
            <TableContainer>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 480 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 200, position: 'sticky', left: 0, bgcolor: 'background.neutral', zIndex: 1 }}>Aluno</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>Progresso</TableCell>
                      {data.lessons.map((l, i) => (
                        <Tooltip key={l.id} title={`${l.moduleTitle} — ${l.title}`}>
                          <TableCell align="center" sx={{ minWidth: 44 }}>
                            {i + 1}
                          </TableCell>
                        </Tooltip>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.students.map((s) => (
                      <TableRow key={s.subscriptionId} hover>
                        <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper' }}>{s.name}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <LinearProgress variant="determinate" value={s.percent} sx={{ flex: 1, height: 6, borderRadius: 1 }} />
                            <Typography variant="caption">{s.percent}%</Typography>
                          </Stack>
                        </TableCell>
                        {data.lessons.map((l) => (
                          <TableCell key={l.id} align="center">
                            {s.completedLessonIds.includes(l.id) ? (
                              <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main' }} />
                            ) : (
                              <Iconify icon="eva:radio-button-off-fill" sx={{ color: 'text.disabled' }} />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          )}
        </Card>
      )}
    </Stack>
  );
}
