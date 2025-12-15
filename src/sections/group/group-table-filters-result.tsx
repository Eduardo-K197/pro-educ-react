import type { Theme, SxProps } from '@mui/material/styles';
import type { UseSetStateReturn } from 'src/hooks/use-set-state';

import { useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

import { Iconify } from 'src/components/iconify';

type Props = {
  totalResults: number;
  onResetPage: () => void;
  filters: UseSetStateReturn<any>;
  sx?: SxProps<Theme>;
};

export function GroupTableFiltersResult({ filters, totalResults, onResetPage, sx }: Props) {
  const handleRemoveKeyword = useCallback(() => {
    onResetPage();
    filters.setState({ name: '' });
  }, [filters, onResetPage]);

  const handleReset = useCallback(() => {
    onResetPage();
    filters.setState({ name: '', status: 'all' });
  }, [filters, onResetPage]);

  return (
    <Box sx={sx}>
      <Box sx={{ mb: 1.5, typography: 'body2' }}>
        <strong>{totalResults}</strong>
        <Box component="span" sx={{ color: 'text.secondary', ml: 0.25 }}>
          resultados encontrados
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {filters.state.name && (
          <Chip
            size="small"
            label={filters.state.name}
            onDelete={handleRemoveKeyword}
            deleteIcon={<Iconify icon="solar:close-circle-bold" />}
          />
        )}

        <Button
          color="error"
          onClick={handleReset}
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
        >
          Limpar
        </Button>
      </Box>
    </Box>
  );
}
