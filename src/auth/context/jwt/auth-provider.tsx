'use client';

import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from 'src/hooks/use-set-state';

import axios, { STORAGE_KEYS } from 'src/utils/axios';

import { setSession } from './utils';
import { STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';

import type { AuthState } from '../../types';

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(STORAGE_KEY);
      if (!accessToken) {
        setState({ user: null, loading: false });
        return;
      }

      try {
        await setSession(accessToken);
      } catch {
        (axios as any).defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      }

      const res = await axios.get('/sign-in');
      const d: any = res?.data || {};

      const schools: any[] = Array.isArray(d?.schools) ? d.schools : [];
      const activeSchoolId =
        d?.activeSchoolId || schools.find((s: any) => s?.isDefault)?.id || schools[0]?.id || null;

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('proeduc-user', JSON.stringify(d));
        if (activeSchoolId) {
          sessionStorage.setItem(STORAGE_KEYS.schoolId, activeSchoolId);
        }
      }

      if (d?.user) {
        const rawUser = d.user || {};

        // 👇 normalização básica pra ficar amigável no front
        const normalizedUser = {
          ...rawUser,
          // tenta pegar um nome “bonitinho”
          displayName:
            rawUser.displayName || rawUser.name || rawUser.razaoSocial || rawUser.nome || '',
          email: rawUser.email ?? d.email ?? '',
          // se um dia vier avatar/foto, dá pra mapear aqui também:
          // photoURL: rawUser.photoURL ?? rawUser.avatar ?? undefined,
        };

        setState({
          user: {
            ...normalizedUser,
            accessToken,
            schools,
            activeSchoolId,
          },
          loading: false,
        });
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error('[auth] checkUserSession failed:', error);
      sessionStorage.removeItem(STORAGE_KEY);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const status = state.loading ? 'loading' : state.user ? 'authenticated' : 'unauthenticated';

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user, role: state.user?.role ?? 'admin' } : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
