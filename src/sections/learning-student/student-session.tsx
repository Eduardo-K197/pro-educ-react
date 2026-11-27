'use client';

import type { StudentMe } from 'src/services/learning-student';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { getStudentToken, clearStudentToken, StudentLearningApi } from 'src/services/learning-student';

// ----------------------------------------------------------------------

type StudentSessionValue = {
  me: StudentMe | null;
  signOut: () => void;
  reload: () => Promise<void>;
};

const StudentSessionContext = createContext<StudentSessionValue>({ me: null, signOut: () => {}, reload: async () => {} });

export const useStudentSession = () => useContext(StudentSessionContext);

/** Telas da área do aluno que não exigem login. */
const PUBLIC_PAGES = ['/aluno/entrar', '/aluno/convite', '/aluno/redefinir-senha', '/aluno/esqueci-senha'];

export function isPublicStudentPage(pathname: string) {
  const path = pathname.replace(/\/+$/, '');
  return PUBLIC_PAGES.includes(path);
}

/** Sessão do aluno: sem token válido, manda para /aluno/entrar. */
export function StudentSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = isPublicStudentPage(pathname);
  const [me, setMe] = useState<StudentMe | null>(null);
  const [checking, setChecking] = useState(!isPublic);

  const signOut = useCallback(() => {
    clearStudentToken();
    setMe(null);
    router.replace(paths.student.signIn);
  }, [router]);

  const reload = useCallback(async () => {
    setMe(await StudentLearningApi.me());
  }, []);

  useEffect(() => {
    if (isPublic) {
      setChecking(false);
      return;
    }
    if (!getStudentToken()) {
      router.replace(paths.student.signIn);
      return;
    }
    if (me) {
      setChecking(false);
      return;
    }
    setChecking(true);
    reload()
      .catch(() => {
        // 401 já redireciona no interceptor; outros erros (ex.: módulo desligado) também saem da sessão.
        clearStudentToken();
        router.replace(paths.student.signIn);
      })
      .finally(() => setChecking(false));
  }, [isPublic, me, reload, router]);

  const value = useMemo(() => ({ me, signOut, reload }), [me, signOut, reload]);

  if (checking || (!isPublic && !me)) {
    return (
      <Box sx={{ py: 12, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <StudentSessionContext.Provider value={value}>{children}</StudentSessionContext.Provider>;
}
