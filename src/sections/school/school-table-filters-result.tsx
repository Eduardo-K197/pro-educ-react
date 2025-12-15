'use client';

import type { SxProps } from '@mui/material/styles';

import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';

type ISchoolTableFilters = {
  name: string;
  status: 'all' | 'ok' | 'pending' | 'overdue';
  startDate: Date | null;
  endDate: Date | null;
};

type Props = {
  filters: ISchoolTableFilters;
  totalResults: number;
  onResetFilters: () => void;
  onResetPage: () => void;
  sx?: SxProps;
};

export function SchoolTableFiltersResult({
  filters,
  totalResults,
  onResetFilters,
  onResetPage,
  sx,
}: Props) {
  const { name, status, startDate, endDate } = filters;

  const hasFilters = !!name || status !== 'all' || (startDate && endDate);

  if (!hasFilters) {
    return null;
  }

  return (
    <Stack spacing={1} direction="row" alignItems="center" flexWrap="wrap" sx={sx}>
      <Typography variant="subtitle2">Results: {totalResults}</Typography>

      {!!name && <Chip size="small" label={`Search: ${name}`} />}

      {status !== 'all' && (
        <Chip
          size="small"
          label={
            status === 'ok'
              ? 'Status: OK'
              : status === 'pending'
                ? 'Status: Pending'
                : 'Status: Overdue'
          }
        />
      )}

      {startDate && endDate && (
        <Chip size="small" label={`Date: ${fDate(startDate)} - ${fDate(endDate)}`} />
      )}

      <Button
        size="small"
        onClick={() => {
          onResetFilters();
          onResetPage();
        }}
      >
        Clear
      </Button>
    </Stack>
  );
}
