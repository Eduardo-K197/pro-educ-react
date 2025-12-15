'use client';

import type { SchoolListItem, SchoolsIndexResponse } from 'src/types/services/school';

import { useState, useEffect, useMemo, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { orderBy } from 'src/utils/helper';

import { SchoolService } from 'src/services/school';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SchoolCardItem } from './school-card-item';

type SchoolStatus = 'ok' | 'pending' | 'overdue';
type SchoolStatusFilter = 'all' | SchoolStatus;

function getSchoolStatus(school: SchoolListItem): SchoolStatus {
  const overdue = Number(school.entryOverdueCount ?? 0);
  const pending = Number(school.entryPendingCount ?? 0);

  if (overdue > 0) return 'overdue';
  if (pending > 0) return 'pending';
  return 'ok';
}

const STATUS_OPTIONS: { value: SchoolStatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'ok', label: 'Em dia' },
  { value: 'pending', label: 'Pendências' },
  { value: 'overdue', label: 'Em atraso' },
];

export function SchoolListView() {
  const [schools, setSchools] = useState<SchoolListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SchoolStatusFilter>('all');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);

        const res = await SchoolService.list();
        const data = (res as SchoolsIndexResponse)?.schools ?? [];

        if (mounted) {
          setSchools(data);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar escolas', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const handleStatusChange = useCallback((value: SchoolStatusFilter) => {
    setStatusFilter(value);
  }, []);

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLowerCase();

    let data = schools;

    if (term) {
      data = data.filter((school) => school.name.toLowerCase().includes(term));
    }

    if (statusFilter !== 'all') {
      data = data.filter((school) => getSchoolStatus(school) === statusFilter);
    }

    return orderBy(data, ['name'], ['asc']);
  }, [schools, search, statusFilter]);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  const notFound = !filteredSchools.length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Schools"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Schools', href: paths.dashboard.schools.root },
          { name: 'List' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.schools.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            New school
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Toolbar (search + contagem + filtro de status) */}
      <Stack spacing={2.5} sx={{ mb: { xs: 3, md: 5 } }}>
        <Stack
          spacing={2}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          direction={{ xs: 'column', sm: 'row' }}
        >
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={handleSearch}
            placeholder="Buscar escola..."
            InputProps={{
              startAdornment: (
                <Iconify icon="eva:search-fill" width={18} sx={{ mr: 1, color: 'text.disabled' }} />
              ),
            }}
          />

          <Typography variant="body2" color="text.secondary">
            {filteredSchools.length} escola(s) encontrada(s)
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {STATUS_OPTIONS.map((option) => {
            const selected = statusFilter === option.value;

            return (
              <Chip
                key={option.value}
                label={option.label}
                size="small"
                variant={selected ? 'filled' : 'outlined'}
                color={selected && option.value !== 'all' ? 'primary' : 'default'}
                onClick={() => handleStatusChange(option.value)}
              />
            );
          })}
        </Stack>
      </Stack>

      {notFound && <EmptyContent filled sx={{ py: 10 }} title="Nenhuma escola encontrada" />}

      {!notFound && (
        <Grid container spacing={3}>
          {filteredSchools.map((school) => (
            <Grid xs={12} sm={6} md={4} key={school.id}>
              <SchoolCardItem school={school} />
            </Grid>
          ))}
        </Grid>
      )}
    </DashboardContent>
  );
}
