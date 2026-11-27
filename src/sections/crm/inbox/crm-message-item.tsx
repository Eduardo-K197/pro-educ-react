'use client';

import type { CrmMessage } from 'src/types/services/crm';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { CrmMedia } from './crm-media';
import { MESSAGE_STATUS_ICON } from './utils';

// ----------------------------------------------------------------------

export type CrmMessageActions = {
  /** Usuário logado (só ele edita/apaga as próprias mensagens). */
  myUserId?: string;
  capabilities?: { editMessages?: boolean; deleteMessages?: boolean; reactions?: boolean };
  onEdit?: (message: CrmMessage) => void;
  onDelete?: (message: CrmMessage) => void;
  onReact?: (message: CrmMessage, emoji: string) => void;
};

type Props = CrmMessageActions & {
  message: CrmMessage;
  onReply?: (message: CrmMessage) => void;
  onOpenImage?: (url: string) => void;
};

export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
/** Limites do WhatsApp: editar até 15 min, apagar para todos até ~48h. */
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const DELETE_WINDOW_MS = 48 * 3600 * 1000;

function ownActions(message: CrmMessage, actions: CrmMessageActions) {
  const own =
    message.direction === 'out' &&
    !message.deleted &&
    !!actions.myUserId &&
    message.author?.id === actions.myUserId &&
    message.source === 'agent' &&
    !['queued', 'pending', 'failed'].includes(message.status);
  const age = Date.now() - new Date(message.sentAt || message.createdAt).getTime();
  return {
    canEdit: own && message.type === 'text' && !!actions.capabilities?.editMessages && !!actions.onEdit && age < EDIT_WINDOW_MS,
    canDelete: own && !!actions.capabilities?.deleteMessages && !!actions.onDelete && age < DELETE_WINDOW_MS,
  };
}

const MEDIA_TYPES = ['image', 'audio', 'video', 'document', 'sticker'];

export function CrmMessageItem({ message, onReply, onOpenImage, ...actions }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [reactAnchor, setReactAnchor] = useState<HTMLElement | null>(null);

  if (message.direction === 'sys') {
    return (
      <Stack alignItems="center" sx={{ my: 2 }}>
        <Typography
          variant="caption"
          sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: 'background.neutral', color: 'text.secondary' }}
        >
          {message.body} · {fDateTime(message.createdAt, 'DD/MM HH:mm')}
        </Typography>
      </Stack>
    );
  }

  const me = message.direction === 'out';
  const { canEdit, canDelete } = ownActions(message, actions);
  const canReact = !!actions.capabilities?.reactions && !!actions.onReact && !message.deleted && !!message.id;
  const status = MESSAGE_STATUS_ICON[message.status];
  const fromAi = me && message.source === 'ai';
  const author =
    me &&
    !fromAi &&
    (message.source === 'bot' ? 'Automática' : message.author?.name || (message.source === 'phone' ? 'Celular' : null));

  const renderBody = () => {
    if (message.deleted) {
      return (
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>
          Mensagem apagada
        </Typography>
      );
    }
    const caption = message.body && !['image', 'video', 'document'].includes(message.type) ? null : message.body;
    return (
      <>
        {message.quoted && (
          <Box
            sx={{
              mb: 1,
              px: 1,
              py: 0.5,
              borderLeft: (theme) => `3px solid ${theme.vars.palette.primary.main}`,
              bgcolor: 'action.hover',
              borderRadius: 0.5,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
              {message.quoted.body || `[${message.quoted.type}]`}
            </Typography>
          </Box>
        )}
        {MEDIA_TYPES.includes(message.type) && <CrmMedia message={message} onOpenImage={onOpenImage} />}
        {message.type === 'location' && message.location && (
          <Typography
            component="a"
            variant="body2"
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
          >
            📍 {message.location.name || 'Ver localização no mapa'}
          </Typography>
        )}
        {(message.body && (MEDIA_TYPES.includes(message.type) ? caption : true) && message.type !== 'location') && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', mt: MEDIA_TYPES.includes(message.type) ? 0.5 : 0 }}>
            {message.body}
          </Typography>
        )}
        {message.type === 'template' && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            (template oficial)
          </Typography>
        )}
      </>
    );
  };

  return (
    <Stack direction="row" justifyContent={me ? 'flex-end' : 'flex-start'} sx={{ mb: 2 }}>
      <Stack alignItems={me ? 'flex-end' : 'flex-start'} sx={{ maxWidth: '75%' }}>
        {author && (
          <Typography variant="caption" sx={{ color: 'text.disabled', mb: 0.25 }}>
            {author}
          </Typography>
        )}
        {fromAi && (
          <Label
            color="secondary"
            variant="soft"
            startIcon={<Iconify icon="solar:stars-bold" width={12} />}
            sx={{ mb: 0.5 }}
          >
            Assistente IA
          </Label>
        )}
        <Stack
          direction="row"
          alignItems="center"
          sx={{ position: 'relative', '&:hover .message-actions': { opacity: 1 } }}
        >
          <Box
            sx={{
              p: 1.25,
              minWidth: 48,
              borderRadius: 1.25,
              bgcolor: 'background.neutral',
              ...(me && { color: 'grey.800', bgcolor: 'primary.lighter' }),
              ...(message.status === 'failed' && { border: (theme) => `1px solid ${theme.vars.palette.error.main}` }),
            }}
          >
            {renderBody()}
          </Box>
          {!message.deleted && (onReply || canReact || canEdit || canDelete) && (
            <Stack
              direction="row"
              className="message-actions"
              sx={{ opacity: anchor || reactAnchor ? 1 : 0, transition: 'opacity .2s', ...(me ? { order: -1, mr: 0.5 } : { ml: 0.5 }) }}
            >
              {onReply && (
                <Tooltip title="Responder citando">
                  <IconButton size="small" onClick={() => onReply(message)}>
                    <Iconify icon="solar:reply-bold" width={16} />
                  </IconButton>
                </Tooltip>
              )}
              {canReact && (
                <Tooltip title="Reagir">
                  <IconButton size="small" onClick={(e) => setReactAnchor(e.currentTarget)}>
                    <Iconify icon="solar:emoji-funny-circle-bold" width={16} />
                  </IconButton>
                </Tooltip>
              )}
              {(canEdit || canDelete) && (
                <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
                  <Iconify icon="eva:more-vertical-fill" width={16} />
                </IconButton>
              )}
            </Stack>
          )}
          {(message.reaction || message.myReaction) && (
            <Stack
              direction="row"
              spacing={0.25}
              sx={{ position: 'absolute', bottom: -10, [me ? 'left' : 'right']: 4, fontSize: 14 }}
            >
              {message.reaction && (
                <Tooltip title="Reação do contato">
                  <span>{message.reaction}</span>
                </Tooltip>
              )}
              {message.myReaction && (
                <Tooltip title="Sua reação (clique para remover)">
                  <Box
                    component="span"
                    sx={{ cursor: canReact ? 'pointer' : 'default' }}
                    onClick={() => canReact && actions.onReact!(message, '')}
                  >
                    {message.myReaction}
                  </Box>
                </Tooltip>
              )}
            </Stack>
          )}
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {fDateTime(message.sentAt || message.createdAt, 'DD/MM HH:mm')}
            {message.edited ? ' · editada' : ''}
          </Typography>
          {me && status?.icon && (
            <Tooltip title={message.status === 'failed' ? message.error || status.label : status.label}>
              <Iconify icon={status.icon} width={14} sx={{ color: status.color }} />
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Popover
        open={!!reactAnchor}
        anchorEl={reactAnchor}
        onClose={() => setReactAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Stack direction="row" sx={{ p: 0.5 }}>
          {REACTION_EMOJIS.map((emoji) => (
            <IconButton
              key={emoji}
              size="small"
              sx={{ fontSize: 20, ...(message.myReaction === emoji && { bgcolor: 'action.selected' }) }}
              onClick={() => {
                setReactAnchor(null);
                actions.onReact?.(message, message.myReaction === emoji ? '' : emoji);
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Stack>
      </Popover>

      <Menu open={!!anchor} anchorEl={anchor} onClose={() => setAnchor(null)}>
        {canEdit && (
          <MenuItem
            onClick={() => {
              setAnchor(null);
              actions.onEdit?.(message);
            }}
          >
            <Iconify icon="solar:pen-bold" width={18} sx={{ mr: 1 }} />
            Editar
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              setAnchor(null);
              actions.onDelete?.(message);
            }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={18} sx={{ mr: 1 }} />
            Apagar para todos
          </MenuItem>
        )}
      </Menu>
    </Stack>
  );
}
