import type { Dispatch, SetStateAction } from 'react';

import TextField from '@mui/material/TextField';

type Props = {
  query: string;
  onChange: Dispatch<SetStateAction<string>>;
};

export function GroupSearch({ query, onChange }: Props) {
  return (
    <TextField
      value={query}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Buscar grupos..."
      fullWidth
    />
  );
}
