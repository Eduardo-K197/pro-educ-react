import type { EntryListItem } from 'src/types/services/entry';
import type { DashboardStats } from 'src/types/services/dashboard-stats';

import { getTraducedStatus } from 'src/types/services/entry';

import { ApiService } from './api/api';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const [entriesRes, paymentsRes, studentsRes, teachersRes, coursesRes, classroomsRes] =
      await Promise.all([
        ApiService.get<{ entries?: EntryListItem[] }>('/entries', { hasPagination: false }).catch(() => ({ entries: [] })),
        ApiService.get<{ entries?: EntryListItem[] }>('/payments').catch(() => ({ entries: [] })),
        ApiService.get<{ count: number }>('/students', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
        ApiService.get<{ count: number }>('/teachers', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
        ApiService.get<{ count: number }>('/courses', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
        ApiService.get<{ count: number }>('/classrooms', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
      ]);

    const allEntries: EntryListItem[] = [
      ...((entriesRes as any).entries ?? []),
      ...((paymentsRes as any).entries ?? []),
    ];

    const totalPending = allEntries
      .filter((e) => getTraducedStatus(e) === 'Pendente')
      .reduce((s, e) => s + (Number(e.value) || 0), 0);

    const totalOverdue = allEntries
      .filter((e) => getTraducedStatus(e) === 'Atrasado')
      .reduce((s, e) => s + (Number(e.value) || 0), 0);

    const totalReceived = allEntries
      .filter((e) => getTraducedStatus(e) === 'Pago')
      .reduce((s, e) => s + (Number(e.value) || 0), 0);

    return {
      studentCount: (studentsRes as any).count ?? 0,
      teacherCount: (teachersRes as any).count ?? 0,
      courseCount: (coursesRes as any).count ?? 0,
      classroomCount: (classroomsRes as any).count ?? 0,
      totalPending,
      totalOverdue,
      totalReceived,
    };
  }
}
