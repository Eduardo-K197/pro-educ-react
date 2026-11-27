'use client';

import type { CrmAiSuggestion } from 'src/types/services/crm-ai';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  suggestion: CrmAiSuggestion;
  /** Desabilita Usar/Editar quando não dá para enviar mensagem nesta conversa. */
  disabled?: boolean;
  onUse: () => void;
  onEdit: () => void;
  onDismiss: () => void;
};

/**
 * Sugestão da IA para a conversa aberta (evento "crm:ai:suggestion").
 * "Usar" e "Editar" só preenchem o campo de envio: quem envia é sempre o atendente.
 */
export function CrmAiSuggestionCard({ suggestion, disabled, onUse, onEdit, onDismiss }: Props) {
  const handoff = suggestion.decision === 'handoff';
  const hasText = !!suggestion.text?.trim();
  const tone = handoff ? 'warning' : 'secondary';

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        p: 1.5,
        borderRadius: 1.5,
        border: (theme) => `1px dashed ${theme.vars.palette[tone].main}`,
        bgcolor: `${tone}.lighter`,
        color: 'grey.800',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: hasText || suggestion.reason ? 0.75 : 0 }}>
        <Iconify
          icon={handoff ? 'solar:user-hand-up-bold' : 'solar:stars-bold'}
          width={18}
          sx={{ color: `${tone}.dark`, flexShrink: 0 }}
        />
        <Typography variant="subtitle2" sx={{ flex: 1, color: `${tone}.darker` }}>
          {handoff ? 'IA sugere encaminhar para humano' : 'Sugestão da IA'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {fDateTime(suggestion.at, 'HH:mm')}
        </Typography>
        <Tooltip title="Descartar">
          <IconButton size="small" onClick={onDismiss}>
            <Iconify icon="mingcute:close-line" width={16} />
          </IconButton>
        </Tooltip>
      </Stack>

      {handoff && (
        <Typography variant="body2" sx={{ mb: hasText ? 1 : 0 }}>
          {suggestion.reason ? `Motivo: ${suggestion.reason}` : 'A IA entende que esta conversa precisa de um atendente.'}
        </Typography>
      )}

      {hasText && (
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 160, overflow: 'auto' }}
        >
          {suggestion.text}
        </Typography>
      )}

      {!handoff && suggestion.reason && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          {suggestion.reason}
        </Typography>
      )}

      {!!suggestion.citations?.length && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
          {suggestion.citations.map((c) => (
            <Chip
              key={c.chunkId}
              size="small"
              variant="outlined"
              icon={<Iconify icon="solar:document-text-bold" width={14} />}
              label={c.title}
              sx={{ height: 22, fontSize: 11 }}
            />
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button size="small" color="inherit" onClick={onDismiss}>
          Descartar
        </Button>
        {hasText && (
          <>
            <Button size="small" variant="outlined" color={tone} disabled={disabled} onClick={onEdit}>
              Editar
            </Button>
            <Button size="small" variant="contained" color={tone} disabled={disabled} onClick={onUse}>
              Usar
            </Button>
          </>
        )}
      </Stack>
    </Box>
  );
}
