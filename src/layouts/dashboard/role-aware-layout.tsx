'use client';

import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';
import { Iconify } from 'src/components/iconify';

import { navAdmin, navSuperAdmin } from '../config-nav-dashboard';
import { DashboardLayout } from './layout';

const SCHOOL_MODE_KEY = 'proeduc-school-mode';
const SCHOOL_ID_KEY = 'proeduc-school-id';

type Props = {
  children: React.ReactNode;
};

export function RoleAwareDashboardLayout({ children }: Props) {
  const { user } = useAuthContext();
  const role = user?.role ?? 'admin';

  const [schoolMode, setSchoolMode] = useState(false);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const active = sessionStorage.getItem(SCHOOL_MODE_KEY) === 'true';
    setSchoolMode(active);
    if (active) {
      const id = sessionStorage.getItem(SCHOOL_ID_KEY);
      const schools = (user?.schools as any[]) ?? [];
      const found = schools.find((s: any) => s.id === id);
      setSchoolName(found?.name ?? 'Escola');
    }
  }, [user]);

  const isSuperAdmin = role === 'superAdmin';
  const useAdminNav = !isSuperAdmin || schoolMode;
  const nav = useAdminNav ? navAdmin : navSuperAdmin;

  const handleExitSchool = () => {
    sessionStorage.removeItem(SCHOOL_MODE_KEY);
    window.location.href = '/dashboard';
  };

  return (
    <DashboardLayout data={{ nav }}>
      {schoolMode && isSuperAdmin && (
        <Box
          sx={{
            px: 3,
            py: 1,
            bgcolor: 'primary.lighter',
            borderBottom: '1px solid',
            borderColor: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Iconify icon="solar:eye-bold-duotone" sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'primary.dark', flexGrow: 1 }}>
            Modo supervisor — acessando <strong>{schoolName}</strong>
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<Iconify icon="eva:arrow-back-fill" />}
            onClick={handleExitSchool}
          >
            Sair da escola
          </Button>
        </Box>
      )}
      {children}
    </DashboardLayout>
  );
}
