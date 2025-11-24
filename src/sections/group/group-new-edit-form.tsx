'use client';

import { useMemo, useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import type {
  IGroupItem,
  IGroupCreatePayload,
  IGroupUpdatePayload,
} from 'src/types/group';

type Props = {
  initialValues?: Partial<IGroupItem>;
  loading?: boolean;
  onSubmit: (payload: IGroupCreatePayload | IGroupUpdatePayload) => Promise<void>;
  isEdit?: boolean;
};

export function GroupNewEditForm({ initialValues, loading, onSubmit, isEdit }: Props) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [tags, setTags] = useState((initialValues?.tags ?? []).join(', '));
  const [locations, setLocations] = useState((initialValues?.locations ?? []).join(', '));
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    (initialValues?.visibility as 'public' | 'private') ?? 'public'
  );
  const [totalMembers, setTotalMembers] = useState<number>(initialValues?.totalMembers ?? 0);

  useEffect(() => {
    // atualiza se initialValues mudar
    if (initialValues) {
      if (initialValues.name !== undefined) setName(initialValues.name);
      if (initialValues.description !== undefined) setDescription(initialValues.description);
      if (initialValues.tags !== undefined) setTags(initialValues.tags.join(', '));
      if (initialValues.locations !== undefined) setLocations(initialValues.locations.join(', '));
      if (initialValues.visibility !== undefined)
        setVisibility(initialValues.visibility as 'public' | 'private');
      if (initialValues.totalMembers !== undefined) setTotalMembers(initialValues.totalMembers);
    }
  }, [initialValues]);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: IGroupCreatePayload | IGroupUpdatePayload = {
      name: name.trim(),
      description: description.trim(),
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      locations: locations.split(',').map((l) => l.trim()).filter(Boolean),
      visibility,
      totalMembers: Number.isFinite(totalMembers) ? totalMembers : 0,
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <TextField
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={3}
        />

        <TextField
          label="Tags (separe por vírgula)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="frontend, react, ui"
        />

        <TextField
          label="Locais (separe por vírgula)"
          value={locations}
          onChange={(e) => setLocations(e.target.value)}
          placeholder="Remote, São Paulo"
        />

        <TextField
          select
          label="Visibilidade"
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'public' | 'private')}
        >
          <MenuItem value="public">Público</MenuItem>
          <MenuItem value="private">Privado</MenuItem>
        </TextField>

        <TextField
          type="number"
          label="Total de membros"
          value={totalMembers}
          onChange={(e) => setTotalMembers(Number(e.target.value))}
          inputProps={{ min: 0 }}
        />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button type="submit" variant="contained" disabled={!canSubmit || !!loading}>
            {isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
