'use client';

import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { AdminService } from 'src/services/admin';

type Props = {
  open: boolean;
  onClose: () => void;
  schoolId: string;
  linkedAdminIds?: string[];
  onRefresh?: () => void;
};

export function SchoolQuickAddAdmin({ open, onClose, schoolId, linkedAdminIds = [], onRefresh }: Props) {
  const [allAdmins, setAllAdmins] = useState<{ id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSelectedAdminId(null);
    setLoading(true);
    AdminService.list()
      .then((res) => setAllAdmins(res.admins ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const available = useMemo(
    () => allAdmins.filter((a) => !linkedAdminIds.includes(a.id)),
    [allAdmins, linkedAdminIds]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.toLowerCase();
    return available.filter(
      (a) => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
  }, [available, search]);

  const handleLink = async () => {
    if (!selectedAdminId) return;
    setLinking(true);
    try {
      const detail = await AdminService.detail(selectedAdminId);
      const currentSchools = (detail.schools ?? []).map((s: any) => s.id ?? s);
      if (!currentSchools.includes(schoolId)) {
        currentSchools.push(schoolId);
      }
      await AdminService.update(selectedAdminId, { schools: currentSchools });
      toast.success('Admin vinculado com sucesso!');
      onRefresh?.();
      onClose();
    } catch {
      toast.error('Erro ao vincular admin');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>Vincular administrador</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Stack alignItems="center" sx={{ py: 3 }}>
              <CircularProgress size={24} />
            </Stack>
          ) : filtered.length === 0 ? (
            <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: 'center' }}>
              {available.length === 0
                ? 'Todos os admins já estão vinculados a esta escola.'
                : 'Nenhum admin encontrado.'}
            </Typography>
          ) : (
            <List
              dense
              sx={{
                maxHeight: 320,
                overflowY: 'auto',
                borderRadius: 1.5,
                bgcolor: 'background.neutral',
                p: 0.5,
              }}
            >
              {filtered.map((admin) => (
                <ListItem key={admin.id} disablePadding>
                  <ListItemButton
                    selected={selectedAdminId === admin.id}
                    onClick={() =>
                      setSelectedAdminId(selectedAdminId === admin.id ? null : admin.id)
                    }
                    sx={{
                      borderRadius: 1,
                      mb: 0.25,
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        '&:hover': { bgcolor: 'primary.lighter' },
                      },
                    }}
                  >
                    <ListItemText
                      primary={admin.name}
                      secondary={admin.email}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    {selectedAdminId === admin.id && (
                      <Chip
                        size="small"
                        label="Selecionado"
                        color="primary"
                        variant="soft"
                        sx={{ ml: 1, height: 20, fontSize: 11 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          loading={linking}
          disabled={!selectedAdminId}
          onClick={handleLink}
        >
          Vincular
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}