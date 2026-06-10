'use client';

import { useCallback } from 'react';
import { useRouter } from 'src/routes/hooks';
import { STORAGE_KEYS } from 'src/utils/axios';

const SCHOOL_MODE_KEY = 'proeduc-school-mode';

export function useSchoolMode() {
  const router = useRouter();

  const enterSchool = useCallback(
    (schoolId: string) => {
      if (typeof window === 'undefined') return;
      sessionStorage.setItem(STORAGE_KEYS.schoolId, schoolId);
      sessionStorage.setItem(SCHOOL_MODE_KEY, 'true');
      router.push('/dashboard');
      router.refresh();
    },
    [router]
  );

  const exitSchool = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SCHOOL_MODE_KEY);
    router.push('/dashboard');
    router.refresh();
  }, [router]);

  const isInSchoolMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(SCHOOL_MODE_KEY) === 'true';
  };

  return { enterSchool, exitSchool, isInSchoolMode };
}
