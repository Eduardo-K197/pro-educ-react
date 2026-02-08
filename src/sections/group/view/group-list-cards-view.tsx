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

import { orderBy } from 'src/utils/helper';

import { GroupService } from 'src/services/group';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { GroupCardItem } from '../group-card-item';
import { GroupQuickAddGroup } from '../group-quick-add-group';

export function GroupListCardsView() {
  const [groups, setGroups] = useState<IGroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await GroupService.getAll();
      setGroups(res); 
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

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
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setOpenCreate(true)}
          >
            Novo grupo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Toolbar */}
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

      {openCreate && (
        <GroupQuickAddGroup
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onRefresh={fetchGroups} 
        />
      )}

    </DashboardContent>
  );
}