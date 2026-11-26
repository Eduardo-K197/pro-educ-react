'use client';

import type { CrmTag, CrmAgent, CrmDepartment, CrmConversation } from 'src/types/services/crm';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Badge from '@mui/material/Badge';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { fToNow } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { initials, INBOX_TABS, formatPhone } from './utils';

import type { InboxTab } from './utils';

// ----------------------------------------------------------------------

export type InboxFilters = {
  search: string;
  departmentId: string;
  assignee: string;
  tagId: string;
};

type Props = {
  tab: InboxTab;
  onTab: (tab: InboxTab) => void;
  counts: Record<string, number>;
  filters: InboxFilters;
  onFilters: (filters: InboxFilters) => void;
  conversations: CrmConversation[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  departments: CrmDepartment[];
  agents: CrmAgent[];
  tags: CrmTag[];
  canSupervise: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onNew: () => void;
};

export function CrmInboxNav({
  tab,
  onTab,
  counts,
  filters,
  onFilters,
  conversations,
  loading,
  hasMore,
  onLoadMore,
  selectedId,
  onSelect,
  departments,
  agents,
  tags,
  canSupervise,
  muted,
  onToggleMute,
  onNew,
}: Props) {
  const set = (patch: Partial<InboxFilters>) => onFilters({ ...filters, ...patch });
  const tabCount = (value: InboxTab) => (value === 'pending' ? (counts.pending ?? 0) + (counts.bot ?? 0) : counts[value] ?? 0);

  return (
    <Stack sx={{ width: { xs: 1, md: 340 }, flexShrink: 0, borderRight: (theme) => `solid 1px ${theme.vars.palette.divider}`, minHeight: 0 }}>
      <Stack direction="row" alignItems="center" sx={{ px: 2, pt: 2, pb: 1 }} spacing={1}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Atendimento
        </Typography>
        <Tooltip title={muted ? 'Ativar som' : 'Silenciar'}>
          <IconButton size="small" onClick={onToggleMute}>
            <Iconify icon={muted ? 'solar:bell-off-bold' : 'solar:bell-bing-bold'} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Nova conversa">
          <IconButton size="small" color="primary" onClick={onNew}>
            <Iconify icon="solar:pen-new-square-bold" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Tabs value={tab} onChange={(_e, v) => onTab(v)} variant="fullWidth" sx={{ px: 1 }}>
        {INBOX_TABS.map((t) => (
          <Tab
            key={t.value}
            value={t.value}
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>{t.label}</span>
                {t.value !== 'closed' && tabCount(t.value) > 0 && (
                  <Label color={t.value === 'pending' ? 'error' : 'info'}>{tabCount(t.value)}</Label>
                )}
              </Stack>
            }
            sx={{ fontSize: 13 }}
          />
        ))}
      </Tabs>

      <Stack spacing={1} sx={{ p: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar nome, telefone ou protocolo"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <Stack direction="row" spacing={1}>
          <TextField select size="small" label="Setor" value={filters.departmentId} onChange={(e) => set({ departmentId: e.target.value })} sx={{ flex: 1 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="none">Sem setor</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Atendente" value={filters.assignee} onChange={(e) => set({ assignee: e.target.value })} sx={{ flex: 1 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="me">Minhas</MenuItem>
            <MenuItem value="none">Sem atendente</MenuItem>
            {canSupervise &&
              agents.map((a) => (
                <MenuItem key={`${a.userType}:${a.userId}`} value={a.userId}>
                  {a.name}
                </MenuItem>
              ))}
          </TextField>
        </Stack>
        {tags.length > 0 && (
          <TextField select size="small" label="Tag" value={filters.tagId} onChange={(e) => set({ tagId: e.target.value })}>
            <MenuItem value="">Todas</MenuItem>
            {tags.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color, mr: 1, display: 'inline-block' }} />
                {t.name}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', minHeight: 0 }}>
        {conversations.map((c) => (
          <ListItemButton
            key={c.id}
            selected={c.id === selectedId}
            onClick={() => onSelect(c.id)}
            sx={{ py: 1.25, px: 2, gap: 1.5, alignItems: 'flex-start' }}
          >
            <Badge color="error" overlap="circular" badgeContent={c.unreadCount}>
              <Avatar src={c.contact.avatarUrl ?? undefined} sx={{ width: 40, height: 40 }}>
                {initials(c.contact.name)}
              </Avatar>
            </Badge>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="subtitle2" noWrap sx={{ flex: 1 }}>
                  {c.contact.name || formatPhone(c.contact.phone)}
                </Typography>
                {c.lastMessage?.at && (
                  <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>
                    {fToNow(c.lastMessage.at)}
                  </Typography>
                )}
              </Stack>
              <Typography
                variant="body2"
                noWrap
                sx={{ color: c.unreadCount ? 'text.primary' : 'text.secondary', fontWeight: c.unreadCount ? 600 : 400 }}
              >
                {c.lastMessage?.direction === 'out' ? 'Você: ' : ''}
                {c.lastMessage?.preview || '—'}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
                <Label color={c.channel.official ? 'success' : 'default'} variant="soft">
                  {c.channel.official ? 'Oficial' : 'Não oficial'}
                </Label>
                {c.status === 'bot' && <Label color="warning">Menu</Label>}
                {c.departmentName && <Label variant="outlined">{c.departmentName}</Label>}
                {c.assignee?.name && c.status === 'open' && <Label variant="soft" color="info">{c.assignee.name}</Label>}
                {c.tags.slice(0, 2).map((t) => (
                  <Label key={t.id} sx={{ bgcolor: t.color, color: 'common.white' }}>
                    {t.name}
                  </Label>
                ))}
              </Stack>
            </Box>
          </ListItemButton>
        ))}

        {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        {!loading && !conversations.length && (
          <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>
            Nenhuma conversa
          </Typography>
        )}
        {!loading && hasMore && (
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Button size="small" onClick={onLoadMore}>
              Carregar mais
            </Button>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
