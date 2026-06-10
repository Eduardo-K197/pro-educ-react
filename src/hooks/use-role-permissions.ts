'use client';

import { useAuthContext } from 'src/auth/hooks';

export type AppRole = 'superAdmin' | 'admin' | 'teacher' | 'employee';

export function useRolePermissions() {
  const { user } = useAuthContext();
  const role = (user?.role ?? 'employee') as AppRole;

  return {
    role,
    isSuperAdmin: role === 'superAdmin',
    isAdmin: role === 'admin',
    isTeacher: role === 'teacher',
    isEmployee: role === 'employee',
    // Write permissions
    canDeleteStudent: role !== 'employee',
    canDeleteFinancial: role !== 'employee',
    canCreateStudent: role !== 'employee',
    canCreateFinancial: role !== 'employee',
    canManageTeachers: role === 'admin' || role === 'superAdmin',
    canManageSchool: role === 'admin' || role === 'superAdmin',
  };
}
