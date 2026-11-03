'use client';

import type { SubscriptionDetail } from 'src/services/subscription';

import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { fDate } from 'src/utils/format-time';
import { localDateString } from 'src/utils/financial';

import { SubscriptionService } from 'src/services/subscription';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

import { useAuthContext } from 'src/auth/hooks';

export function StudentMaterials({
  subscription,
  onSaved,
}: {
  subscription?: SubscriptionDetail;
  onSaved: () => void;
}) {
  const { user } = useAuthContext();
  const [materialId, setMaterialId] = useState('');
  const [date, setDate] = useState(localDateString());
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    setMaterialId('');
    setConfirm(false);
  }, [subscription?.id]);
  const materials = Array.from(
    new Map(
      (subscription?.classroom?.course?.materials ?? []).map((material) => [material.id, material])
    ).values()
  );
  const received = subscription?.receivedMaterials ?? [];
  const available = materials.filter(
    (material) => !received.some((receipt) => receipt.materialId === material.id)
  );
  const canWrite =
    ['superAdmin', 'admin', 'employee', 'teacher'].includes(user?.role) && !subscription?.deletedAt;
  const save = async () => {
    if (
      !subscription ||
      !available.some((material) => material.id === materialId) ||
      !date ||
      saving ||
      !canWrite
    )
      return;
    setSaving(true);
    try {
      await SubscriptionService.update(subscription.id, {
        receivedMaterials: [
          ...received.map((receipt) => ({
            materialId: receipt.materialId,
            receivedAt: receipt.receivedAt,
          })),
          { materialId, receivedAt: `${date}T12:00:00.000Z` },
        ],
      });
      setConfirm(false);
      setMaterialId('');
      onSaved();
      toast.success('Entrega de material registrada.');
    } catch {
      toast.error('Não foi possível registrar a entrega. O histórico foi preservado.');
    } finally {
      setSaving(false);
    }
  };
  if (!subscription) return null;
  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Typography variant="h6">Entrega de materiais</Typography>
        {subscription.deletedAt && (
          <Alert severity="info">
            Matrícula cancelada: histórico disponível somente para consulta.
          </Alert>
        )}
        {!materials.length && !received.length && (
          <Typography color="text.secondary">
            Nenhum material cadastrado para este curso.
          </Typography>
        )}
        {received.map((receipt) => (
          <Typography key={receipt.materialId} variant="body2">
            {materials.find((material) => material.id === receipt.materialId)?.name ??
              'Material do histórico'}{' '}
            — entregue em {fDate(receipt.receivedAt)}
          </Typography>
        ))}
        {canWrite && available.length > 0 && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Material a entregar"
              value={materialId}
              disabled={saving}
              onChange={(event) => setMaterialId(event.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Selecione o material</MenuItem>
              {available.map((material) => (
                <MenuItem key={material.id} value={material.id}>
                  {material.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="date"
              label="Data da entrega"
              InputLabelProps={{ shrink: true }}
              value={date}
              disabled={saving}
              onChange={(event) => setDate(event.target.value)}
            />
            <Button
              variant="contained"
              disabled={!materialId || !date || saving}
              onClick={() => setConfirm(true)}
            >
              Registrar entrega
            </Button>
          </Stack>
        )}
        <ConfirmDialog
          open={confirm}
          onClose={() => {
            if (!saving) setConfirm(false);
          }}
          title="Confirmar entrega de material"
          content={`Registrar a entrega de “${materials.find((material) => material.id === materialId)?.name ?? ''}” em ${date}? Os registros anteriores serão preservados.`}
          action={
            <LoadingButton variant="contained" loading={saving} onClick={save}>
              Confirmar entrega
            </LoadingButton>
          }
        />
      </Stack>
    </Card>
  );
}
