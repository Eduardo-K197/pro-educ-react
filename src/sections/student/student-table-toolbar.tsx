'use client';

import type { UseSetStateReturn } from 'src/hooks/use-set-state';
import type { IStudentTableFilters } from 'src/types/services/student';

import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  filters: UseSetStateReturn<IStudentTableFilters>;
  onResetPage: () => void;
};

export function StudentTableToolbar({ filters, onResetPage }: Props) {
  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-end', sm: 'center' }}
      sx={{ p: 2.5, pr: { xs: 2.5, md: 1 } }}
    >
      <TextField
        fullWidth
        size="small"
        value={filters.state.name}
        onChange={(e) => {
          onResetPage();
          filters.setState({ name: e.target.value });
        }}
        placeholder="Buscar aluno..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}
