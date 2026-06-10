'use client';

import { useMemo, useState, useEffect } from 'react';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import type { IGroupItem, IGroupCreatePayload, IGroupUpdatePayload } from 'src/types/group';

type Props = {
  initialValues?: Partial<IGroupItem>;
  loading?: boolean;
  onSubmit: (payload: IGroupCreatePayload | IGroupUpdatePayload) => Promise<void>;
  isEdit?: boolean;
  onCancel?: () => void;
};

export function GroupNewEditForm({ initialValues, loading, onSubmit, isEdit, onCancel }: Props) {
  const raw = (initialValues ?? {}) as Record<string, any>;

  const [name, setName] = useState<string>(String(raw.name ?? ''));
  const [description, setDescription] = useState<string>(String(raw.description ?? ''));
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    raw.visibility === 'private' ? 'private' : 'public'
  );

  useEffect(() => {
    const r = (initialValues ?? {}) as Record<string, any>;
    if (r.name !== undefined) setName(String(r.name));
    if (r.description !== undefined) setDescription(String(r.description));
    if (r.visibility !== undefined) setVisibility(r.visibility === 'private' ? 'private' : 'public');
  }, [initialValues]);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      visibility,
    } as any as IGroupCreatePayload | IGroupUpdatePayload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Dados do grupo
            </Typography>

            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Nome do grupo *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <TextField
                fullWidth
                label="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                multiline
                minRows={3}
              />

              <TextField
                fullWidth
                select
                label="Visibilidade"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
              >
                <MenuItem value="public">Público</MenuItem>
                <MenuItem value="private">Privado</MenuItem>
              </TextField>
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={1.5}>
              <LoadingButton
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                loading={!!loading}
                disabled={!canSubmit}
              >
                {isEdit ? 'Salvar alterações' : 'Criar grupo'}
              </LoadingButton>

              {onCancel && (
                <Button fullWidth variant="outlined" color="inherit" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </form>
  );
}
