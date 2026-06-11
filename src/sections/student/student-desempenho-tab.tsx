'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
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
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate, fTime } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';

import axios from 'src/utils/axios';

import type { SubscriptionDetail, SubscriptionPresence } from 'src/services/subscription';
import { SubscriptionService } from 'src/services/subscription';

// ----------------------------------------------------------------------

interface Comment {
  id: string;
  content: string;
  createdAt?: string;
  student?: { id: number; name: string };
}

interface Props {
  studentId: number;
}

export function StudentDesempenhoTab({ studentId }: Props) {
  const [subscriptions, setSubscriptions] = useState<SubscriptionDetail[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const loadComments = useCallback(() => {
    setLoadingComments(true);
    axios
      .get('/comments', { params: { studentId } })
      .then((res) => setComments(res.data?.comments ?? []))
      .catch(() => toast.error('Erro ao carregar comentários'))
      .finally(() => setLoadingComments(false));
  }, [studentId]);

  useEffect(() => {
    SubscriptionService.list({ student: String(studentId), deleted: 'false' })
      .then((res) => {
        const list = res.subscriptions ?? [];
        setSubscriptions(list);
        if (list.length > 0) setSelectedSubId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingSubs(false));

    loadComments();
  }, [studentId, loadComments]);

  const selectedSub = subscriptions.find((s) => s.id === selectedSubId);
  const presences: SubscriptionPresence[] = selectedSub?.presences ?? [];
  const presentCount = presences.filter((p) => p.status === 'present').length;
  const totalCount = presences.length;
  const attendancePct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : null;

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      await axios.post('/comments', { content: newComment.trim(), student: studentId });
      setNewComment('');
      loadComments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar comentário');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      await axios.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error('Erro ao remover comentário');
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <Stack spacing={3}>
      {/* Turma selector + attendance summary */}
      <Card sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Turma</InputLabel>
            <Select
              value={selectedSubId}
              label="Turma"
              onChange={(e) => setSelectedSubId(e.target.value)}
              disabled={loadingSubs}
            >
              {subscriptions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.classroom?.name ?? s.id}
                  {s.classroom?.course?.name ? ` — ${s.classroom.course.name}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {attendancePct !== null && (
            <Chip
              label={`Frequência: ${presentCount}/${totalCount} (${attendancePct}%)`}
              color={attendancePct >= 75 ? 'success' : 'error'}
              variant="soft"
            />
          )}
        </Stack>
      </Card>

      {/* Presences table */}
      <Card>
        <Typography variant="subtitle2" sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
          Registro de aulas
        </Typography>
        {loadingSubs ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={28} />
          </Stack>
        ) : presences.length === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 4, color: 'text.disabled' }}>
            <Iconify icon="solar:calendar-mark-bold-duotone" width={36} />
            <Typography variant="body2">Nenhuma aula registrada.</Typography>
          </Stack>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Horário</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Professor</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status aula</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Presença</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {presences.map((p) => {
                  const cls = p.class;
                  const isPresent = p.status === 'present';
                  return (
                    <TableRow key={p.id} hover>
                      <TableCell>
                        <Typography variant="caption">
                          {cls?.date ? fDate(cls.date) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {cls?.startTime && cls?.endTime
                            ? `${cls.startTime} – ${cls.endTime}`
                            : cls?.startTime ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{cls?.teacher?.name ?? '—'}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {cls?.details ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Label variant="soft" color={cls?.status === 'completed' ? 'success' : 'warning'}>
                          {cls?.status ?? '—'}
                        </Label>
                      </TableCell>
                      <TableCell>
                        <Label variant="soft" color={isPresent ? 'success' : 'error'}>
                          {isPresent ? 'Presente' : 'Faltou'}
                        </Label>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Comments */}
      <Card sx={{ p: 2.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Comentários
        </Typography>

        {loadingComments ? (
          <Stack alignItems="center" sx={{ py: 2 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : comments.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            Nenhum comentário ainda.
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mb: 3 }}>
            {comments.map((comment) => (
              <Stack key={comment.id} direction="row" spacing={1.5} alignItems="flex-start">
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: 13 }}>
                  {comment.student?.name?.charAt(0).toUpperCase() ?? '?'}
                </Avatar>
                <Box
                  sx={{
                    flex: 1,
                    bgcolor: 'background.neutral',
                    borderRadius: 1.5,
                    p: 1.5,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="caption" color="text.secondary">
                      {comment.createdAt ? fDate(comment.createdAt) : ''}
                    </Typography>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      sx={{ mt: -0.5, mr: -0.5 }}
                    >
                      {deletingCommentId === comment.id ? (
                        <CircularProgress size={12} color="error" />
                      ) : (
                        <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                      )}
                    </IconButton>
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {comment.content}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        )}

        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" spacing={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            size="small"
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <IconButton
            color="primary"
            onClick={handleSendComment}
            disabled={sendingComment || !newComment.trim()}
            sx={{ mb: 0.5 }}
          >
            {sendingComment ? (
              <CircularProgress size={20} />
            ) : (
              <Iconify icon="solar:plain-bold-duotone" width={24} />
            )}
          </IconButton>
        </Stack>
      </Card>
    </Stack>
  );
}
