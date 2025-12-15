'use client';

import { useMemo, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

import type { IGroupItem, IGroupCreatePayload, IGroupUpdatePayload } from 'src/types/group';

type Props = {
  initialValues?: Partial<IGroupItem>;
  loading?: boolean;
  onSubmit: (payload: IGroupCreatePayload | IGroupUpdatePayload) => Promise<void>;
  isEdit?: boolean;
};

export function GroupNewEditForm({ initialValues, loading, onSubmit, isEdit }: Props) {
  // "view" solta para não depender do tipo IGroupItem (passa build)
  const raw = (initialValues ?? {}) as Record<string, any>;

  const [name, setName] = useState<string>(String(raw.name ?? ''));
  const [description, setDescription] = useState<string>(String(raw.description ?? ''));
  const [tags, setTags] = useState<string>(Array.isArray(raw.tags) ? raw.tags.join(', ') : '');
  const [locations, setLocations] = useState<string>(
    Array.isArray(raw.locations) ? raw.locations.join(', ') : ''
  );
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    raw.visibility === 'private' ? 'private' : 'public'
  );
  const [totalMembers, setTotalMembers] = useState<number>(
    typeof raw.totalMembers === 'number' ? raw.totalMembers : 0
  );

  useEffect(() => {
    const r = (initialValues ?? {}) as Record<string, any>;

    if (r.name !== undefined) setName(String(r.name));
    if (r.description !== undefined) setDescription(String(r.description));

    if (r.tags !== undefined) {
      setTags(Array.isArray(r.tags) ? r.tags.join(', ') : String(r.tags ?? ''));
    }

    if (r.locations !== undefined) {
      setLocations(Array.isArray(r.locations) ? r.locations.join(', ') : String(r.locations ?? ''));
    }

    if (r.visibility !== undefined) {
      setVisibility(r.visibility === 'private' ? 'private' : 'public');
    }

    if (r.totalMembers !== undefined) {
      setTotalMembers(
        typeof r.totalMembers === 'number' ? r.totalMembers : Number(r.totalMembers) || 0
      );
    }
  }, [initialValues]);

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: name.trim(),
      description: description.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      locations: locations
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
      visibility,
      totalMembers: Number.isFinite(totalMembers) ? totalMembers : 0,
    } as any as IGroupCreatePayload | IGroupUpdatePayload;

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />

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
