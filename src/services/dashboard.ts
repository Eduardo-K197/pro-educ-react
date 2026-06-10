import type { DashboardMonth, DashboardStats } from 'src/types/services/dashboard-stats';

import { ApiService } from './api/api';

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const [months, studentsRes, teachersRes, coursesRes, classroomsRes] = await Promise.all([
      ApiService.get<DashboardMonth[]>('/dashboard/'),
      ApiService.get<{ count: number }>('/students', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
      ApiService.get<{ count: number }>('/teachers', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
      ApiService.get<{ count: number }>('/courses', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
      ApiService.get<{ count: number }>('/classrooms', { page: 1, perPage: 1 }).catch(() => ({ count: 0 })),
    ]);

    const totalPending = (months ?? []).reduce((s, m) => s + (m.totalValuePending ?? 0), 0);
    const totalOverdue = (months ?? []).reduce((s, m) => s + (m.totalValueOverdue ?? 0), 0);
    const totalReceived = (months ?? []).reduce((s, m) => s + (m.totalValueReceived ?? 0), 0);

    return {
      studentCount: (studentsRes as any).count ?? 0,
      teacherCount: (teachersRes as any).count ?? 0,
      courseCount: (coursesRes as any).count ?? 0,
      classroomCount: (classroomsRes as any).count ?? 0,
      totalPending,
      totalOverdue,
      totalReceived,
      months: months ?? [],
    };
  }
}
