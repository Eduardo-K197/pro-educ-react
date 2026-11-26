'use client';

import type { CrmSocketStatus } from 'src/lib/socket';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { useCrmSocket } from 'src/lib/socket';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS: Record<
  CrmSocketStatus,
  { label: string; color: 'success' | 'warning' | 'error' | 'default' | 'info'; icon: string }
> = {
  idle: { label: 'Aguardando', color: 'default', icon: 'solar:clock-circle-bold' },
  connecting: { label: 'Conectando…', color: 'info', icon: 'svg-spinners:180-ring' },
  connected: { label: 'Conectado ao servidor', color: 'success', icon: 'solar:check-circle-bold' },
  reconnecting: { label: 'Reconectando…', color: 'warning', icon: 'svg-spinners:180-ring' },
  error: { label: 'Sem conexão', color: 'error', icon: 'solar:danger-triangle-bold' },
};

export function CrmConnectionStatus() {
  const { status, error, ready, attempts, reconnect } = useCrmSocket();
  const s = STATUS[status];

  return (
    <Card sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Iconify
          icon={s.icon}
          width={32}
          sx={{ color: `${s.color === 'default' ? 'grey' : s.color}.main` }}
        />
        <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle1">Tempo real</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {status === 'connected' && ready
              ? `Sessão ativa desde ${fDateTime(ready.serverTime)}`
              : error || 'Canal de eventos do CRM'}
            {status === 'reconnecting' && attempts > 0 ? ` (tentativa ${attempts})` : ''}
          </Typography>
        </Stack>
        <Label variant="soft" color={s.color}>
          {s.label}
        </Label>
        {status === 'error' && (
          <Button size="small" variant="outlined" onClick={reconnect}>
            Reconectar
          </Button>
        )}
      </Stack>
    </Card>
  );
}
