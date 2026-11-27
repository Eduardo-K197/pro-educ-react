'use client';

import type { CrmAiSuggestion } from 'src/types/services/crm-ai';
import type {
  CrmTag,
  CrmNote,
  CrmAgent,
  CrmMessage,
  CrmDepartment,
  CrmConversation,
  CrmChannelSummary,
} from 'src/types/services/crm';

import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { hasCrmRole } from 'src/hooks/use-crm-permission';

import { CONFIG } from 'src/config-global';
import { CrmService } from 'src/services/crm';
import { useCrmSocketEvent } from 'src/lib/socket';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { CRM_CONVERSATION_STATUS_LABELS } from 'src/types/services/crm';

import { CrmAccessGuard } from '../crm-access-guard';
import { useCrmAccess } from '../crm-access-context';
import { CrmInboxNav } from '../inbox/crm-inbox-nav';
import { CrmMessageList } from '../inbox/crm-message-list';
import { CrmCloseDialog } from '../inbox/crm-close-dialog';
import { CrmStartDialog } from '../inbox/crm-start-dialog';
import { CrmMessageInput } from '../inbox/crm-message-input';
import { CrmInboxDetails } from '../inbox/crm-inbox-details';
import { CrmConnectionStatus } from '../crm-connection-status';
import { CrmTemplateDialog } from '../inbox/crm-template-dialog';
import { CrmTransferDialog } from '../inbox/crm-transfer-dialog';
import { CrmAiSuggestionCard } from '../inbox/crm-ai-suggestion-card';
import {
  isMine,
  isMuted,
  setMuted,
  INBOX_TABS,
  tabOfStatus,
  formatPhone,
  pendingCount,
  canSeeConversation,
  playNotificationSound,
} from '../inbox/utils';

import type { InboxTab } from '../inbox/utils';
import type { InboxFilters } from '../inbox/crm-inbox-nav';
import type { CrmMessageDraft } from '../inbox/crm-message-input';

// ----------------------------------------------------------------------

const PER_PAGE = 30;

export function CrmInboxView() {
  return (
    <DashboardContent maxWidth={false} sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
      <CrmAccessGuard min="agente">
        <CrmInbox />
      </CrmAccessGuard>
    </DashboardContent>
  );
}

const sortByActivity = (a: CrmConversation, b: CrmConversation) =>
  new Date(b.lastMessage?.at ?? b.createdAt).getTime() - new Date(a.lastMessage?.at ?? a.createdAt).getTime();

function CrmInbox() {
  const { me } = useCrmAccess();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  const canSupervise = hasCrmRole(me?.role, 'supervisor');

  // Dados de apoio
  const [departments, setDepartments] = useState<CrmDepartment[]>([]);
  const [agents, setAgents] = useState<CrmAgent[]>([]);
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [channels, setChannels] = useState<CrmChannelSummary[]>([]);

  useEffect(() => {
    CrmService.listDepartments().then(setDepartments).catch(() => undefined);
    CrmService.listAgents().then(setAgents).catch(() => undefined);
    CrmService.listTags().then(setTags).catch(() => undefined);
    CrmService.listChannelSummary().then(setChannels).catch(() => undefined);
  }, []);

  // Lista
  const [tab, setTab] = useState<InboxTab>('pending');
  const [filters, setFilters] = useState<InboxFilters>({ search: '', departmentId: '', assignee: '', tagId: '' });
  const [search, setSearch] = useState('');
  const [list, setList] = useState<CrmConversation[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(true);
  const [muted, setMutedState] = useState(isMuted());

  useEffect(() => {
    const t = setTimeout(() => setSearch(filters.search.trim()), 350);
    return () => clearTimeout(t);
  }, [filters.search]);

  const query = useCallback(
    (p: number) =>
      CrmService.listConversations({
        status: INBOX_TABS.find((t) => t.value === tab)!.statuses,
        departmentId: filters.departmentId || undefined,
        assignee: filters.assignee || undefined,
        tagId: filters.tagId || undefined,
        search: search || undefined,
        page: p,
        perPage: PER_PAGE,
      }),
    [tab, filters.departmentId, filters.assignee, filters.tagId, search]
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setPage(1);
    query(1)
      .then((res) => {
        if (cancelled) return;
        setList(res.data);
        setTotal(res.total);
        setCounts(res.counts);
      })
      .catch((err) => !cancelled && toast.error(err?.message || 'Erro ao carregar conversas'))
      .finally(() => !cancelled && setLoadingList(false));
    return () => {
      cancelled = true;
    };
  }, [query]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setLoadingList(true);
    query(next)
      .then((res) => {
        setList((prev) => [...prev, ...res.data.filter((c) => !prev.some((p) => p.id === c.id))]);
        setPage(next);
        setTotal(res.total);
      })
      .finally(() => setLoadingList(false));
  }, [page, query]);

  // Contagem das abas é recalculada no servidor (debounce) após eventos.
  const countsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshCounts = useCallback(() => {
    if (countsTimer.current) clearTimeout(countsTimer.current);
    countsTimer.current = setTimeout(() => {
      query(1)
        .then((res) => {
          setCounts(res.counts);
          setTotal(res.total);
        })
        .catch(() => undefined);
    }, 800);
  }, [query]);

  /** Aplica uma conversa atualizada à lista conforme aba/filtros/visibilidade. */
  const applyConversation = useCallback(
    (conv: CrmConversation) => {
      const visible = canSeeConversation(me, conv);
      const inTab = tabOfStatus(conv.status) === tab;
      const matches =
        (!filters.departmentId || (filters.departmentId === 'none' ? !conv.departmentId : conv.departmentId === filters.departmentId)) &&
        (!filters.assignee ||
          (filters.assignee === 'me' ? conv.assignee?.id === me?.user.id : filters.assignee === 'none' ? !conv.assignee : conv.assignee?.id === filters.assignee)) &&
        (!filters.tagId || conv.tags.some((t) => t.id === filters.tagId));
      setList((prev) => {
        const without = prev.filter((c) => c.id !== conv.id);
        if (!visible || !inTab || !matches) return without;
        return [...without, conv].sort(sortByActivity);
      });
    },
    [me, tab, filters.departmentId, filters.assignee, filters.tagId]
  );

  // Conversa selecionada
  const [selected, setSelected] = useState<CrmConversation | null>(null);
  const [messages, setMessages] = useState<CrmMessage[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [replyTo, setReplyTo] = useState<CrmMessage | null>(null);
  const details = useBoolean(true);
  const transfer = useBoolean();
  const closeDialog = useBoolean();
  const startDialog = useBoolean();

  // Sugestões da IA: a última por conversa, só em memória (some ao recarregar a página).
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, CrmAiSuggestion>>({});
  const [draft, setDraft] = useState<CrmMessageDraft | null>(null);

  const dismissSuggestion = useCallback((conversationId: string) => {
    setAiSuggestions((prev) => {
      if (!prev[conversationId]) return prev;
      const rest = { ...prev };
      delete rest[conversationId];
      return rest;
    });
  }, []);

  /** "Usar"/"Editar": só preenche o campo de envio; o atendente revisa e envia. */
  const applySuggestion = useCallback(
    (suggestion: CrmAiSuggestion, focus: boolean) => {
      if (!suggestion.text) return;
      setDraft({ conversationId: suggestion.conversationId, text: suggestion.text, focus, nonce: Date.now() });
      dismissSuggestion(suggestion.conversationId);
    },
    [dismissSuggestion]
  );

  const select = useCallback((id: string | null) => router.push(id ? `?id=${id}` : '?'), [router]);

  const markRead = useCallback((conv: CrmConversation) => {
    if (conv.unreadCount > 0 || conv.status === 'open') {
      CrmService.markConversationRead(conv.id).catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return undefined;
    }
    let cancelled = false;
    setLoadingMessages(true);
    setReplyTo(null);
    Promise.all([CrmService.getConversation(selectedId), CrmService.listMessages(selectedId), CrmService.listNotes(selectedId)])
      .then(([conv, msgs, n]) => {
        if (cancelled) return;
        setSelected(conv);
        setMessages(msgs.data);
        setHasMoreMessages(msgs.hasMore);
        setNotes(n);
        markRead(conv);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err?.message || 'Conversa indisponível');
          setSelected(null);
        }
      })
      .finally(() => !cancelled && setLoadingMessages(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId, markRead]);

  const loadOlder = useCallback(() => {
    if (!selectedId || !messages.length) return;
    setLoadingOlder(true);
    CrmService.listMessages(selectedId, messages[0].id)
      .then((res) => {
        setMessages((prev) => [...res.data.filter((m) => !prev.some((p) => p.id === m.id)), ...prev]);
        setHasMoreMessages(res.hasMore);
      })
      .finally(() => setLoadingOlder(false));
  }, [selectedId, messages]);

  const upsertMessage = useCallback((message: CrmMessage) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === message.id);
      if (index === -1) return [...prev, message];
      const copy = [...prev];
      copy[index] = { ...copy[index], ...message, quoted: message.quoted ?? copy[index].quoted };
      return copy;
    });
  }, []);

  const onConversationChanged = useCallback(
    (conv: CrmConversation) => {
      applyConversation(conv);
      if (conv.id === selectedId) setSelected(conv);
    },
    [applyConversation, selectedId]
  );

  // Tempo real -----------------------------------------------------------

  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useCrmSocketEvent<{ reason: string; conversation: CrmConversation }>('crm:conversation:updated', ({ reason, conversation }) => {
    onConversationChanged(conversation);
    refreshCounts();
    if (reason === 'created' && canSeeConversation(me, conversation)) {
      playNotificationSound();
      toast.info(`Nova conversa: ${conversation.contact.name || formatPhone(conversation.contact.phone)}`);
    }
    if ((reason === 'transferred' || reason === 'accepted') && conversation.assignee?.id === me?.user.id && conversation.id !== selectedId) {
      toast.info(`Conversa ${conversation.protocol} atribuída a você`);
    }
  });

  useCrmSocketEvent<{ conversationId: string; message: CrmMessage }>('crm:message:new', ({ conversationId, message }) => {
    if (conversationId === selectedId) {
      upsertMessage(message);
      if (message.direction === 'in' && selected && document.visibilityState === 'visible') {
        if (readTimer.current) clearTimeout(readTimer.current);
        readTimer.current = setTimeout(() => markRead({ ...selected, unreadCount: 1 }), 800);
      }
    }
    if (message.direction === 'in' && (conversationId !== selectedId || document.visibilityState !== 'visible')) {
      const conv = list.find((c) => c.id === conversationId);
      if (conv && (isMine(me, conv) || conv.status !== 'open')) playNotificationSound();
    }
  });

  useCrmSocketEvent<{ conversationId: string; message: CrmMessage }>('crm:message:updated', ({ conversationId, message }) => {
    if (conversationId === selectedId) upsertMessage(message);
  });

  useCrmSocketEvent<{ conversationId: string; note: CrmNote }>('crm:note:new', ({ conversationId, note }) => {
    if (conversationId === selectedId) setNotes((prev) => (prev.some((n) => n.id === note.id) ? prev : [...prev, note]));
  });

  useCrmSocketEvent<CrmAiSuggestion>('crm:ai:suggestion', (suggestion) => {
    if (!suggestion?.conversationId) return;
    setAiSuggestions((prev) => ({ ...prev, [suggestion.conversationId]: suggestion }));
  });

  // Título da aba com contagem de pendentes
  useEffect(() => {
    const pending = pendingCount(counts);
    const base = 'CRM - Atendimento';
    document.title = pending ? `(${pending}) ${base}` : base;
  }, [counts]);

  // Ações -----------------------------------------------------------------

  const act = useCallback(
    async (fn: () => Promise<CrmConversation>, success: string) => {
      try {
        const conv = await fn();
        onConversationChanged(conv);
        refreshCounts();
        toast.success(success);
      } catch (err: any) {
        toast.error(err?.message || 'Não foi possível concluir a ação');
      }
    },
    [onConversationChanged, refreshCounts]
  );

  const addNote = useCallback(
    async (body: string) => {
      if (!selectedId) return;
      const note = await CrmService.addNote(selectedId, body);
      setNotes((prev) => (prev.some((n) => n.id === note.id) ? prev : [...prev, note]));
      details.onTrue();
    },
    [selectedId, details]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!selectedId) return;
      try {
        await CrmService.deleteNote(selectedId, noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao apagar nota');
      }
    },
    [selectedId]
  );

  // Foto do contato (cache na API) -----------------------------------------
  const [avatar, setAvatar] = useState<string | null>(null);
  const contactId = selected?.contact.id;
  const cachedAvatar = selected?.contact.avatarUrl ?? null;
  useEffect(() => {
    setAvatar(cachedAvatar);
    if (!contactId) return undefined;
    let cancelled = false;
    CrmService.contactAvatar(contactId)
      .then((res) => {
        if (!cancelled && res.avatarUrl) setAvatar(res.avatarUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [contactId, cachedAvatar]);

  // Editar / apagar / reagir ---------------------------------------------------
  const editMessage = useCallback(
    async (message: CrmMessage, text: string) => {
      if (!selectedId) return;
      try {
        upsertMessage(await CrmService.editMessage(selectedId, message.id, text));
        toast.success('Mensagem editada');
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao editar mensagem');
        throw err;
      }
    },
    [selectedId, upsertMessage]
  );

  const deleteMessage = useCallback(
    async (message: CrmMessage) => {
      if (!selectedId || !window.confirm('Apagar esta mensagem para todos?')) return;
      try {
        upsertMessage(await CrmService.deleteMessage(selectedId, message.id));
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao apagar mensagem');
      }
    },
    [selectedId, upsertMessage]
  );

  const reactMessage = useCallback(
    async (message: CrmMessage, emoji: string) => {
      if (!selectedId) return;
      try {
        upsertMessage(await CrmService.reactMessage(selectedId, message.id, emoji));
      } catch (err: any) {
        toast.error(err?.message || 'Erro ao reagir');
      }
    },
    [selectedId, upsertMessage]
  );

  const templateDialog = useBoolean();
  const caps = selected?.channel.capabilities;
  const templateAvailable =
    !!selected &&
    !!selected.channel.official &&
    caps?.templates !== false &&
    !selected.channel.deleted &&
    selected.status !== 'closed' &&
    !(selected.status === 'open' && selected.assignee && !isMine(me, selected) && !canSupervise);

  const disabledReason = (() => {
    if (!selected) return null;
    if (selected.status === 'closed') return 'Conversa encerrada. Reabra para responder.';
    if (selected.status === 'open' && selected.assignee && !isMine(me, selected) && !canSupervise) {
      return `Conversa em atendimento com ${selected.assignee.name ?? 'outro atendente'}.`;
    }
    const window = selected.channel.freeformWindowHours;
    if (!selected.lastInboundAt) {
      return selected.channel.official
        ? 'Para falar com este contato use um template aprovado (Nova conversa).'
        : 'Canal não oficial: o contato precisa enviar uma mensagem antes.';
    }
    if (window && Date.now() - new Date(selected.lastInboundAt).getTime() > window * 3600_000) {
      return `Passaram mais de ${window}h desde a última mensagem do contato: só é possível enviar template.`;
    }
    return null;
  })();

  const renderHeader = selected && (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{ px: 2, py: 1.25, minHeight: 64, borderBottom: (theme) => `solid 1px ${theme.vars.palette.divider}`, flexWrap: 'wrap' }}
    >
      <IconButton size="small" sx={{ display: { md: 'none' } }} onClick={() => select(null)}>
        <Iconify icon="eva:arrow-ios-back-fill" />
      </IconButton>
      <Avatar src={avatar ?? undefined} alt={selected.contact.name} sx={{ width: 40, height: 40 }}>
        {(selected.contact.name || '?').charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 160 }}>
        <Typography variant="subtitle1" noWrap>
          {selected.contact.name || formatPhone(selected.contact.phone)}
        </Typography>
        <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {formatPhone(selected.contact.phone)} · {selected.protocol}
          </Typography>
          <Label color={selected.channel.official ? 'success' : 'default'}>
            {selected.channel.official ? 'Oficial' : 'Não oficial'}
          </Label>
          <Label
            color={
              selected.status === 'open'
                ? 'info'
                : selected.status === 'closed'
                  ? 'default'
                  : selected.status === 'ai'
                    ? 'secondary'
                    : 'warning'
            }
          >
            {CRM_CONVERSATION_STATUS_LABELS[selected.status]}
          </Label>
          {selected.departmentName && <Label variant="outlined">{selected.departmentName}</Label>}
          {selected.assignee?.name && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              com {selected.assignee.name}
            </Typography>
          )}
        </Stack>
      </Box>

      {selected.status !== 'closed' && (!isMine(me, selected) || selected.status !== 'open') && (
        <Button size="small" variant="contained" onClick={() => act(() => CrmService.acceptConversation(selected.id), 'Você assumiu a conversa')}>
          {selected.assignee && !isMine(me, selected) ? 'Assumir' : 'Aceitar'}
        </Button>
      )}
      {selected.status !== 'closed' && (
        <>
          <Button size="small" variant="outlined" onClick={transfer.onTrue} startIcon={<Iconify icon="solar:transfer-horizontal-bold" />}>
            Transferir
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={closeDialog.onTrue}>
            Encerrar
          </Button>
        </>
      )}
      {selected.status === 'closed' && (
        <Button size="small" variant="contained" onClick={() => act(() => CrmService.reopenConversation(selected.id), 'Conversa reaberta')}>
          Reabrir
        </Button>
      )}
      <Tooltip title={details.value ? 'Ocultar detalhes' : 'Detalhes do contato'}>
        <IconButton onClick={details.onToggle}>
          <Iconify icon="solar:user-id-bold" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <>
      <CrmConnectionStatus />
      <Card sx={{ mt: 2, flex: '1 1 auto', display: 'flex', minHeight: 560, height: { md: '78vh' }, overflow: 'hidden' }}>
        <Box sx={{ display: { xs: selectedId ? 'none' : 'flex', md: 'flex' }, width: { xs: 1, md: 'auto' } }}>
          <CrmInboxNav
            tab={tab}
            onTab={setTab}
            counts={counts}
            filters={filters}
            onFilters={setFilters}
            conversations={list}
            loading={loadingList}
            hasMore={list.length < total}
            onLoadMore={loadMore}
            selectedId={selectedId}
            onSelect={select}
            departments={departments}
            agents={agents}
            tags={tags}
            canSupervise={canSupervise}
            muted={muted}
            onToggleMute={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
            onNew={startDialog.onTrue}
          />
        </Box>

        <Stack sx={{ flex: '1 1 auto', minWidth: 0, display: { xs: selectedId ? 'flex' : 'none', md: 'flex' } }}>
          {!selectedId || (!selected && !loadingMessages) ? (
            <EmptyContent
              title="Selecione uma conversa"
              description="As novas conversas aparecem em Pendentes em tempo real."
              imgUrl={`${CONFIG.assetsDir}/assets/icons/empty/ic-chat-active.svg`}
              sx={{ flex: 1 }}
            />
          ) : (
            <>
              {renderHeader}
              <Stack direction="row" sx={{ flex: '1 1 auto', minHeight: 0 }}>
                <Stack sx={{ flex: '1 1 auto', minWidth: 0 }}>
                  <CrmMessageList
                    loading={loadingMessages}
                    messages={messages}
                    hasMore={hasMoreMessages}
                    loadingMore={loadingOlder}
                    onLoadMore={loadOlder}
                    onReply={setReplyTo}
                    myUserId={me?.user.id}
                    capabilities={selected?.channel.deleted ? undefined : selected?.channel.capabilities}
                    onEditText={editMessage}
                    onDelete={deleteMessage}
                    onReact={reactMessage}
                  />
                  {selected && (
                    <CrmMessageInput
                      conversationId={selected.id}
                      disabledReason={disabledReason}
                      replyTo={replyTo}
                      onCancelReply={() => setReplyTo(null)}
                      onSent={upsertMessage}
                      onNote={addNote}
                      draft={draft}
                      onOpenTemplate={templateAvailable ? templateDialog.onTrue : undefined}
                      slotAbove={
                        aiSuggestions[selected.id] && (
                          <CrmAiSuggestionCard
                            suggestion={aiSuggestions[selected.id]}
                            disabled={!!disabledReason}
                            onUse={() => applySuggestion(aiSuggestions[selected.id], false)}
                            onEdit={() => applySuggestion(aiSuggestions[selected.id], true)}
                            onDismiss={() => dismissSuggestion(selected.id)}
                          />
                        )
                      }
                    />
                  )}
                </Stack>
                {selected && details.value && (
                  <Stack
                    sx={{
                      width: 320,
                      flexShrink: 0,
                      borderLeft: (theme) => `solid 1px ${theme.vars.palette.divider}`,
                      display: { xs: 'none', lg: 'flex' },
                      minHeight: 0,
                    }}
                  >
                    <CrmInboxDetails
                      conversation={selected}
                      tags={tags}
                      notes={notes}
                      onConversation={onConversationChanged}
                      onDeleteNote={deleteNote}
                      myUserId={me?.user.id}
                      canSupervise={canSupervise}
                    />
                  </Stack>
                )}
              </Stack>
            </>
          )}
        </Stack>
      </Card>

      {selected && (
        <>
          <CrmTransferDialog
            open={transfer.value}
            onClose={transfer.onFalse}
            conversation={selected}
            departments={departments}
            agents={agents}
            onDone={(c) => {
              onConversationChanged(c);
              refreshCounts();
            }}
          />
          <CrmTemplateDialog
            open={templateDialog.value}
            onClose={templateDialog.onFalse}
            conversation={selected}
            onSent={upsertMessage}
          />
          <CrmCloseDialog
            open={closeDialog.value}
            onClose={closeDialog.onFalse}
            conversation={selected}
            onDone={(c) => {
              onConversationChanged(c);
              refreshCounts();
            }}
          />
        </>
      )}
      <CrmStartDialog
        open={startDialog.value}
        onClose={startDialog.onFalse}
        channels={channels}
        onDone={(c) => {
          setTab('open');
          select(c.id);
        }}
      />
    </>
  );
}
