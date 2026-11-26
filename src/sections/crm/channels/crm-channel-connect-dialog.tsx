'use client';

import type { CrmChannel, CrmChannelState } from 'src/types/services/crm';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { CrmService } from 'src/services/crm';
import { useCrmSocketEvent } from 'src/lib/socket';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';

import { CRM_CHANNEL_STATE_LABELS } from 'src/types/services/crm';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  channel: CrmChannel;
  onClose: () => void;
  onStatus: (status: CrmChannelState) => void;
};

const QR_REFRESH_MS = 8000;

/** Conecta um canal WAHA: cria a sessão, mostra o QR (renovado) ou o código de pareamento. */
export function CrmChannelConnectDialog({ open, channel, onClose, onStatus }: Props) {
  const [tab, setTab] = useState<'qr' | 'code'>('qr');
  const [status, setStatus] = useState<CrmChannelState>(channel.status);
  const [qr, setQr] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(
    (s: CrmChannelState) => {
      setStatus(s);
      onStatus(s);
    },
    [onStatus]
  );

  const start = useCallback(async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await CrmService.connectChannel(channel.id);
      updateStatus(res.status as CrmChannelState);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível iniciar a sessão');
    } finally {
      setStarting(false);
    }
  }, [channel.id, updateStatus]);

  useEffect(() => {
    if (open) {
      setQr(null);
      setCode(null);
      setError(null);
      start();
    }
  }, [open, start]);

  // QR expira em ~20s na WAHA: renova enquanto o status pedir.
  useEffect(() => {
    if (!open || tab !== 'qr' || status === 'connected') return undefined;
    let cancelled = false;
    const fetchQr = () =>
      CrmService.channelQr(channel.id)
        .then((res) => {
          if (cancelled) return;
          if (res.status !== status) updateStatus(res.status as CrmChannelState);
          setQr(res.qr);
        })
        .catch(() => undefined);
    fetchQr();
    const timer = setInterval(fetchQr, QR_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, tab, status, channel.id, updateStatus]);

  useCrmSocketEvent<{ channelId: string; state: CrmChannelState }>('crm:channel:status', (payload) => {
    if (payload.channelId !== channel.id) return;
    updateStatus(payload.state);
    if (payload.state === 'connected') toast.success('WhatsApp conectado');
  });

  const requestCode = async () => {
    setError(null);
    try {
      const res = await CrmService.channelPairingCode(channel.id, phone);
      setCode(res.code);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível gerar o código');
    }
  };

  const connected = status === 'connected';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Conectar {channel.name}{' '}
        <Label color={connected ? 'success' : status === 'error' ? 'error' : 'warning'} sx={{ ml: 1 }}>
          {CRM_CHANNEL_STATE_LABELS[status] ?? status}
        </Label>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {connected ? (
          <Alert severity="success">Número conectado. As mensagens recebidas já aparecem na caixa de entrada.</Alert>
        ) : (
          <>
            <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
              <Tab value="qr" label="QR code" />
              <Tab value="code" label="Código por telefone" />
            </Tabs>
            {tab === 'qr' ? (
              <Stack alignItems="center" spacing={2}>
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  No celular: WhatsApp → Aparelhos conectados → Conectar aparelho, e aponte para o código.
                </Typography>
                <Box sx={{ width: 264, height: 264, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'common.white', borderRadius: 1 }}>
                  {qr && qr.startsWith('data:') ? (
                    <Box component="img" src={qr} alt="QR code" sx={{ width: 256, height: 256 }} />
                  ) : (
                    <CircularProgress />
                  )}
                </Box>
                {starting && <Typography variant="caption">Iniciando sessão...</Typography>}
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No celular: WhatsApp → Aparelhos conectados → Conectar aparelho → Conectar com número de telefone. Digite o
                  número do WhatsApp que será conectado (com DDI e DDD) e use o código gerado.
                </Typography>
                <TextField label="Número (ex.: 5511999998888)" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button variant="contained" onClick={requestCode} disabled={phone.replace(/\D/g, '').length < 12}>
                  Gerar código
                </Button>
                {code && (
                  <Typography variant="h3" sx={{ textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace' }}>
                    {code}
                  </Typography>
                )}
              </Stack>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {!connected && (
          <Button onClick={start} disabled={starting}>
            Reiniciar sessão
          </Button>
        )}
        <Button variant="contained" onClick={onClose}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
