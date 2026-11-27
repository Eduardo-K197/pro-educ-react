'use client';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

import { useStudentSession, StudentSessionProvider } from './student-session';

// ----------------------------------------------------------------------

function StudentHeader() {
  const { me, signOut } = useStudentSession();
  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: (t) => `solid 1px ${t.vars.palette.divider}` }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          component={RouterLink}
          href={me ? paths.student.root : paths.student.signIn}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.primary', textDecoration: 'none', flex: 1, minWidth: 0 }}
        >
          <Iconify icon="solar:book-bookmark-bold-duotone" width={28} sx={{ color: 'primary.main', flexShrink: 0 }} />
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" noWrap>
              {me?.school.name || 'ProEduc'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: -0.5 }} noWrap>
              Área do aluno
            </Typography>
          </Stack>
        </Box>
        {me && (
          <>
            <Typography variant="body2" noWrap sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 220 }}>
              {me.student.name}
            </Typography>
            <IconButton onClick={signOut} aria-label="Sair">
              <Iconify icon="solar:logout-2-bold-duotone" />
            </IconButton>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

/** Layout próprio da área do aluno: simples, pensado para o celular. */
export function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentSessionProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.neutral' }}>
        <StudentHeader />
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </StudentSessionProvider>
  );
}
