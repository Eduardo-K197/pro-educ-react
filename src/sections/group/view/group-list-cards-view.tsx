'use client';

import type { IGroupItem } from 'src/types/group';

import { useState, useEffect, useMemo, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { orderBy } from 'src/utils/helper';

import { GroupService } from 'src/services/group';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GroupCardItem } from '../group-card-item';

export function GroupListCardsView() {
  const [groups, setGroups] = useState<IGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;

    GroupService.getAll()
      .then((res) => {
        if (mounted) setGroups(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  }, []);

  const filteredGroups = useMemo(() => {
    const byName = search.trim().toLowerCase();

    let data = groups;

    if (byName) {
      data = data.filter((group) => group.name.toLowerCase().includes(byName));
    }

    return orderBy(data, ['name'], ['asc']);
  }, [groups, search]);

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: '60vh' }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  const notFound = !filteredGroups.length;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Grupos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Grupos', href: paths.dashboard.group.root },
          { name: 'Lista (Grupos)' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.group.new}
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            Novo grupo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Toolbar no estilo do Job (search + contagem) */}
      <Stack
        spacing={2.5}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <TextField
          fullWidth
          size="small"
          value={search}
          onChange={handleSearch}
          placeholder="Buscar grupo..."
          InputProps={{
            startAdornment: (
              <Iconify icon="eva:search-fill" width={18} sx={{ mr: 1, color: 'text.disabled' }} />
            ),
          }}
        />

        <Typography variant="body2" color="text.secondary">
          {filteredGroups.length} grupo(s) encontrado(s)
        </Typography>
      </Stack>

      {notFound && <EmptyContent filled sx={{ py: 10 }} title="Nenhum grupo encontrado" />}

      {!notFound && (
        <Grid container spacing={3}>
          {filteredGroups.map((group, idx) => (
            <Grid xs={12} sm={6} md={4} key={group.id ?? idx}>
              <GroupCardItem group={group} />
            </Grid>
          ))}
        </Grid>
      )}
    </DashboardContent>
  );
}
