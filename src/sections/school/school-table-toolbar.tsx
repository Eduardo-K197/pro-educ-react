'use client';

import type { SxProps } from '@mui/material/styles';
import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';

import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { Iconify } from 'src/components/iconify';

type ISchoolTableFilters = {
  name: string;
  status: 'all' | 'ok' | 'pending' | 'overdue';
  startDate: Date | null;
  endDate: Date | null;
};

type Props = {
  filters: ISchoolTableFilters;
  onFiltersChange: (name: keyof ISchoolTableFilters, value: any) => void;
  onResetFilters: () => void;
  onResetPage: () => void;
  dateError: boolean;
  sx?: SxProps;
};

export function SchoolTableToolbar({ filters, onFiltersChange, dateError, sx }: Props) {
  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems="center"
      justifyContent="space-between"
      sx={{ p: 2.5, ...sx }}
    >
      <Stack spacing={2} direction="row" alignItems="center" flexWrap="wrap">
        <DatePicker
          label="Start date"
          value={filters.startDate ? dayjs(filters.startDate) : null}
          onChange={(newValue: Dayjs | null) =>
            onFiltersChange('startDate', newValue ? newValue.toDate() : null)
          }
          slotProps={{
            textField: {
              error: !!dateError,
              helperText: dateError ? 'End date must be later than start date' : '',
            },
          }}
        />

        <DatePicker
          label="End date"
          value={filters.endDate ? dayjs(filters.endDate) : null}
          onChange={(newValue: Dayjs | null) =>
            onFiltersChange('endDate', newValue ? newValue.toDate() : null)
          }
          slotProps={{
            textField: {
              error: !!dateError,
            },
          }}
        />
      </Stack>

      <TextField
        value={filters.name}
        onChange={(event) => onFiltersChange('name', event.target.value)}
        placeholder="Search school..."
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" />
            </InputAdornment>
          ),
        }}
        sx={{ width: { xs: '100%', md: 360 } }}
      />
    </Stack>
  );
}
