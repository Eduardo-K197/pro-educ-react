'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from 'src/auth/hooks';
import { SchoolDashboardView } from 'src/sections/school-dashboard/view';
import { SchoolListView } from 'src/sections/school/school-list-view';

const SCHOOL_MODE_KEY = 'proeduc-school-mode';

export function SchoolOrAdminDashboard() {
  const { user } = useAuthContext();
  const role = user?.role ?? 'admin';

  const [schoolMode, setSchoolMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSchoolMode(sessionStorage.getItem(SCHOOL_MODE_KEY) === 'true');
      setReady(true);
    }
  }, []);

  if (!ready) return null;

  const isSuperAdmin = role === 'superAdmin';

  if (isSuperAdmin && !schoolMode) {
    return <SchoolListView />;
  }

  return <SchoolDashboardView />;
}
