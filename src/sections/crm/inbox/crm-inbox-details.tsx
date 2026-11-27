'use client';

import type { CrmTag, CrmNote, CrmLinkSearch, CrmConversation, CrmContactDetail } from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useSchoolModules } from 'src/hooks/use-school-modules';

import { fCurrency } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { CrmService } from 'src/services/crm';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { CrmInboxDealPanel } from 'src/sections/growth/components/inbox-deal-panel';

import { CRM_CONVERSATION_STATUS_LABELS } from 'src/types/services/crm';

import { formatPhone } from './utils';

// ----------------------------------------------------------------------

type Props = {
  conversation: CrmConversation;
  tags: CrmTag[];
  notes: CrmNote[];
  onConversation: (conversation: CrmConversation) => void;
  onDeleteNote: (noteId: string) => void;
  myUserId?: string;
  canSupervise: boolean;
};

type LinkOption =
  | { kind: 'student'; id: number; label: string; hint: string }
  | { kind: 'guardian'; id: string; label: string; hint: string };

export function CrmInboxDetails({ conversation, tags, notes, onConversation, onDeleteNote, myUserId, canSupervise }: Props) {
  // Lead no painel só com o Growth contratado (ChatFlow + Growth).
  const { modules } = useSchoolModules();
  const [contact, setContact] = useState<CrmContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<LinkOption[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    CrmService.getContact(conversation.contact.id)
      .then((c) => {
        setContact(c);
        setName(c.name ?? '');
      })
      .catch((err) => toast.error(err?.message || 'Erro ao carregar contato'))
      .finally(() => setLoading(false));
  }, [conversation.contact.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setOptions([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      CrmService.searchLinks(query.trim())
        .then((res: CrmLinkSearch) =>
          setOptions([
            ...res.students.map((s) => ({ kind: 'student' as const, id: s.id, label: s.name, hint: `Aluno · ${s.status}` })),
            ...res.guardians.map((g) => ({
              kind: 'guardian' as const,
              id: g.id,
              label: g.name || 'Responsável',
              hint: `Responsável de ${g.students.join(', ')}`,
            })),
          ])
        )
        .catch(() => setOptions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const saveContact = async (payload: Parameters<typeof CrmService.updateContact>[1]) => {
    try {
      await CrmService.updateContact(conversation.contact.id, payload);
      load();
      onConversation(await CrmService.getConversation(conversation.id));
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar contato');
    }
  };

  const setTags = async (selected: CrmTag[]) => {
    try {
      const updated = await CrmService.setConversationTags(conversation.id, selected.map((t) => t.id));
      onConversation(updated);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao aplicar tags');
    }
  };

  if (loading && !contact) return <CircularProgress size={24} sx={{ m: 'auto', mt: 4, display: 'block' }} />;
  if (!contact) return null;

  const {student} = contact;

  return (
    <Box sx={{ p: 2, overflowY: 'auto', minHeight: 0 }}>
      <Stack spacing={1.5}>
        <TextField
          size="small"
          label="Nome do contato"
          value={name}
          placeholder={contact.profileName ?? ''}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== (contact.name ?? '') && saveContact({ name: name || null })}
        />
        <Typography variant="body2">
          <Iconify icon="solar:phone-bold" width={16} sx={{ mr: 0.5, verticalAlign: 'middle' }} />
          {formatPhone(contact.phone) || '(número oculto pelo WhatsApp)'}
        </Typography>
        {contact.optedOut && (
          <Chip
            size="small"
            color="warning"
            variant="soft"
            icon={<Iconify icon="solar:bell-off-bold" width={16} />}
            label="Não recebe campanhas (SAIR)"
            sx={{ alignSelf: 'flex-start' }}
          />
        )}
        {canSupervise && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={!!contact.optedOut}
                onChange={(e) => saveContact({ optedOut: e.target.checked })}
              />
            }
            label={
              <Typography variant="caption">
                Bloquear campanhas para este contato
                {contact.optedOut && contact.optedOutAt ? ` (desde ${fDate(contact.optedOutAt)})` : ''}
              </Typography>
            }
          />
        )}
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Protocolo {conversation.protocol} · {CRM_CONVERSATION_STATUS_LABELS[conversation.status]}
          {conversation.channel.name ? ` · ${conversation.channel.name}` : ''}
        </Typography>

        <Autocomplete
          multiple
          size="small"
          options={tags}
          value={tags.filter((t) => conversation.tags.some((x) => x.id === t.id))}
          getOptionLabel={(t) => t.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_e, v) => setTags(v)}
          renderTags={(value, getTagProps) =>
            value.map((t, i) => (
              <Chip {...getTagProps({ index: i })} key={t.id} size="small" label={t.name} sx={{ bgcolor: t.color, color: 'common.white' }} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="Tags da conversa" />}
        />

        <Divider />

        {modules.growth && (
          <>
            <CrmInboxDealPanel conversation={conversation} />
            <Divider />
          </>
        )}

        <Typography variant="subtitle2">Vínculo com o cadastro</Typography>
        {student ? (
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Link component={RouterLink} href={paths.dashboard.students.details(String(student.id))} variant="subtitle2">
                {student.name}
              </Link>
              <IconButton size="small" onClick={() => saveContact({ studentId: null })}>
                <Iconify icon="mingcute:close-line" width={16} />
              </IconButton>
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Situação: {student.status}
              {student.classrooms.length ? ` · Turma: ${student.classrooms.map((c) => c.name).join(', ')}` : ''}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <Label color={student.financial.situation === 'inadimplente' ? 'error' : 'success'}>
                {student.financial.situation === 'inadimplente' ? 'Inadimplente' : 'Em dia'}
              </Label>
              {student.financial.overdueCount > 0 && (
                <Typography variant="caption">
                  {student.financial.overdueCount} em atraso ({fCurrency(student.financial.overdueTotal)})
                </Typography>
              )}
            </Stack>
            {student.financial.nextDue && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Próximo vencimento: {fDate(student.financial.nextDue.dueDate)} · {fCurrency(student.financial.nextDue.value)}
              </Typography>
            )}
          </Box>
        ) : null}
        {contact.guardian && (
          <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">Responsável: {contact.guardian.name}</Typography>
              <IconButton size="small" onClick={() => saveContact({ guardianId: null })}>
                <Iconify icon="mingcute:close-line" width={16} />
              </IconButton>
            </Stack>
            {contact.guardian.students.map((s) => (
              <Link key={s.id} component={RouterLink} href={paths.dashboard.students.details(String(s.id))} variant="caption" sx={{ display: 'block' }}>
                {s.name} ({s.status})
              </Link>
            ))}
          </Box>
        )}
        <Autocomplete
          size="small"
          options={options}
          filterOptions={(x) => x}
          getOptionLabel={(o) => o.label}
          onInputChange={(_e, v) => setQuery(v)}
          onChange={(_e, o) => {
            if (!o) return;
            saveContact(o.kind === 'student' ? { studentId: o.id } : { guardianId: o.id });
          }}
          renderOption={(props, o) => (
            <li {...props} key={`${o.kind}-${o.id}`}>
              <Stack>
                <Typography variant="body2">{o.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {o.hint}
                </Typography>
              </Stack>
            </li>
          )}
          renderInput={(params) => <TextField {...params} label="Vincular aluno ou responsável" placeholder="Nome, CPF ou telefone" />}
          noOptionsText={query.length < 2 ? 'Digite ao menos 2 letras' : 'Nada encontrado'}
        />

        <Divider />

        <Typography variant="subtitle2">Notas internas</Typography>
        {!notes.length && (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Nenhuma nota. Use o modo &quot;nota&quot; no campo de mensagem.
          </Typography>
        )}
        {notes.map((n) => (
          <Box key={n.id} sx={{ p: 1, borderRadius: 1, bgcolor: 'warning.lighter', color: 'grey.800' }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {n.body}
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: 'grey.600' }}>
                {n.author.name} · {fDateTime(n.createdAt, 'DD/MM HH:mm')}
              </Typography>
              {(n.author.id === myUserId || canSupervise) && (
                <IconButton size="small" onClick={() => onDeleteNote(n.id)}>
                  <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                </IconButton>
              )}
            </Stack>
          </Box>
        ))}

        <Divider />

        <Typography variant="subtitle2">Histórico</Typography>
        {contact.history.map((h) => (
          <Typography key={h.id} variant="caption" sx={{ color: 'text.secondary' }}>
            {fDate(h.createdAt)} · {h.protocol} · {CRM_CONVERSATION_STATUS_LABELS[h.status]}
            {h.rating ? ` · ${'★'.repeat(h.rating)}` : ''}
          </Typography>
        ))}
        <Button size="small" onClick={load} startIcon={<Iconify icon="solar:refresh-bold" />}>
          Atualizar
        </Button>
      </Stack>
    </Box>
  );
}
