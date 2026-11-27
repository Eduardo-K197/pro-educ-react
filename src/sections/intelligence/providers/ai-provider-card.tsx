'use client';

import type {
  AiProviderInfo,
  AiProvidersState,
  AiProviderTestResult,
} from 'src/types/services/ai-providers';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fDateTime } from 'src/utils/format-time';

import { AiProviderService } from 'src/services/ai-providers';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { aiTestErrorLabel } from 'src/types/services/ai-providers';

// ----------------------------------------------------------------------

type Props = {
  info: AiProviderInfo;
  onChange: (state: AiProvidersState) => void;
};

type Busy = 'testNew' | 'testCurrent' | 'save' | 'toggle' | 'remove' | null;

type LocalTest = AiProviderTestResult & { at: string; target: 'new' | 'current' };

const fmt = (date: string | null | undefined) => (date ? fDateTime(date, 'DD/MM/YYYY HH:mm') : null);

function StatusLabel({ info }: { info: AiProviderInfo }) {
  if (!info.configured) return <Label color="default">Não configurado</Label>;
  if (info.source === 'db') return <Label color="success">Configurado (banco)</Label>;
  if (info.source === 'env') return <Label color="info">Configurado (variável de ambiente)</Label>;
  return <Label color="success">Configurado</Label>;
}

function TestResult({ ok, error, at, detail }: { ok: boolean; error?: string | null; at?: string | null; detail?: string }) {
  return (
    <Alert severity={ok ? 'success' : 'error'} sx={{ py: 0 }}>
      <Typography variant="body2">
        {ok ? 'Chave funcionando' : aiTestErrorLabel(error)}
        {detail ? ` · ${detail}` : ''}
      </Typography>
      {at && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {fmt(at)}
        </Typography>
      )}
    </Alert>
  );
}

/** Card de um provedor de IA: status, chave mascarada, nova chave, teste e chave salva no banco. */
export function AiProviderCard({ info, onChange }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [localTest, setLocalTest] = useState<LocalTest | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const trimmedKey = apiKey.trim();

  const runTest = async (target: 'new' | 'current') => {
    setBusy(target === 'new' ? 'testNew' : 'testCurrent');
    try {
      const result = await AiProviderService.test(
        info.provider,
        target === 'new' ? { apiKey: trimmedKey } : {}
      );
      setLocalTest({ ...result, at: new Date().toISOString(), target });
      if (result.ok) toast.success(`${info.label}: chave funcionando (${result.latencyMs} ms)`);
      else toast.error(`${info.label}: ${aiTestErrorLabel(result.error)}`);
      // O teste da chave vigente atualiza o lastTest no servidor.
      if (target === 'current') {
        AiProviderService.list()
          .then(onChange)
          .catch(() => undefined);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao testar a chave');
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy('save');
    try {
      const state = await AiProviderService.update(info.provider, { apiKey: trimmedKey });
      // Nunca guardar a chave depois de salvar.
      setApiKey('');
      setShowKey(false);
      setLocalTest(null);
      onChange(state);
      toast.success(`${info.label}: chave salva`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar a chave');
    } finally {
      setBusy(null);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    setBusy('toggle');
    try {
      const state = await AiProviderService.update(info.provider, { enabled });
      onChange(state);
      toast.success(enabled ? 'Chave salva em uso' : 'Chave salva desligada');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao alterar a chave salva');
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy('remove');
    try {
      const state = await AiProviderService.removeKey(info.provider);
      setConfirmRemove(false);
      setLocalTest(null);
      onChange(state);
      toast.success(`${info.label}: chave salva removida`);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao remover a chave');
    } finally {
      setBusy(null);
    }
  };

  const { stored, lastTest } = info;

  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h6">{info.label}</Typography>
          <StatusLabel info={info} />
        </Stack>

        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Chave em uso
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {info.keyHint ?? '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Sem chave salva (ou com ela desligada), vale a variável de ambiente{' '}
            <strong>{info.envVar}</strong>.
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <LoadingButton
            size="small"
            variant="outlined"
            color="inherit"
            loading={busy === 'testCurrent'}
            disabled={!!busy || !info.configured}
            onClick={() => runTest('current')}
            startIcon={<Iconify icon="solar:test-tube-bold-duotone" />}
            sx={{ alignSelf: 'flex-start' }}
          >
            Testar chave atual
          </LoadingButton>
          {localTest?.target === 'current' ? (
            <TestResult
              ok={localTest.ok}
              error={localTest.error}
              at={localTest.at}
              detail={`${localTest.model} · ${localTest.latencyMs} ms`}
            />
          ) : (
            lastTest && (
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Último teste
                </Typography>
                <TestResult ok={lastTest.ok} error={lastTest.error} at={lastTest.at} />
              </Stack>
            )
          )}
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Chave salva no banco</Typography>
          {stored ? (
            <>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {stored.keyHint ?? '—'}
              </Typography>
              {(stored.updatedAt || stored.updatedBy) && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Atualizada{stored.updatedAt ? ` em ${fmt(stored.updatedAt)}` : ''}
                  {stored.updatedBy ? ` por ${stored.updatedBy}` : ''}
                </Typography>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={stored.enabled}
                    disabled={!!busy}
                    onChange={(e) => toggleEnabled(e.target.checked)}
                  />
                }
                label="Usar chave salva"
              />
              <Button
                size="small"
                color="error"
                variant="soft"
                disabled={!!busy}
                onClick={() => setConfirmRemove(true)}
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                sx={{ alignSelf: 'flex-start' }}
              >
                Remover chave salva
              </Button>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Nenhuma chave salva.
            </Typography>
          )}
        </Stack>

        <Divider />

        <Stack spacing={1}>
          <Typography variant="subtitle2">{stored ? 'Trocar chave' : 'Nova chave'}</Typography>
          <TextField
            size="small"
            fullWidth
            label="Cole a chave da API"
            type={showKey ? 'text' : 'password'}
            autoComplete="new-password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              if (localTest?.target === 'new') setLocalTest(null);
            }}
            inputProps={{ spellCheck: false }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={() => setShowKey((v) => !v)}
                    aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    <Iconify icon={showKey ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Stack direction="row" spacing={1}>
            <LoadingButton
              size="small"
              variant="outlined"
              color="inherit"
              loading={busy === 'testNew'}
              disabled={!trimmedKey || !!busy}
              onClick={() => runTest('new')}
            >
              Testar
            </LoadingButton>
            <LoadingButton
              size="small"
              variant="contained"
              loading={busy === 'save'}
              disabled={!trimmedKey || !!busy}
              onClick={save}
            >
              Salvar
            </LoadingButton>
          </Stack>
          {localTest?.target === 'new' && (
            <TestResult
              ok={localTest.ok}
              error={localTest.error}
              detail={`${localTest.model} · ${localTest.latencyMs} ms`}
            />
          )}
        </Stack>
      </Stack>

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Remover chave salva?"
        content={
          <>
            A chave de {info.label} salva no banco será apagada. A partir daí vale a variável de
            ambiente <strong>{info.envVar}</strong>, se estiver definida nos servidores; sem ela, o
            provedor fica sem chave.
          </>
        }
        action={
          <LoadingButton variant="contained" color="error" loading={busy === 'remove'} onClick={remove}>
            Remover
          </LoadingButton>
        }
      />
    </Card>
  );
}
