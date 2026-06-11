import type { AxiosRequestConfig } from 'axios';

import { ApiService } from './api/api';

export interface Grade {
  id: string;
  studentId: number;
  subjectId?: string;
  value: number;
  kind?: string;
  weight: number | string;
  periodId?: string;
  subject?: { id: string; name: string };
}

export interface CoursePeriod {
  id: string;
  name: string;
  shortName?: string;
  order: number;
  weight?: string;
  courseId: string;
  startAt?: string;
  endAt?: string;
}

export interface GradeCreatePayload {
  subjectId: string;
  value: number;
  periodId?: string;
  kind?: string;
  weight?: number;
}

export interface GradeUpdatePayload {
  value?: number;
  periodId?: string | null;
  kind?: string | null;
  weight?: number | null;
}

export class GradeService {
  static listForStudent(
    studentId: number | string,
    params?: { courseId?: string; periodId?: string },
    config?: AxiosRequestConfig
  ): Promise<{ grades: Grade[] }> {
    return ApiService.get<{ grades: Grade[] }>(
      `/students/${studentId}/grades`,
      params as Record<string, string>,
      config
    );
  }

  static create(
    studentId: number | string,
    payload: GradeCreatePayload,
    config?: AxiosRequestConfig
  ): Promise<Grade> {
    return ApiService.post<GradeCreatePayload, Grade>(
      `/students/${studentId}/grades`,
      payload,
      config
    );
  }

  static update(
    studentId: number | string,
    gradeId: string,
    payload: GradeUpdatePayload,
    config?: AxiosRequestConfig
  ): Promise<Grade> {
    return ApiService.put<GradeUpdatePayload, Grade>(
      `/students/${studentId}/grades/${gradeId}`,
      payload,
      config
    );
  }

  static delete(
    studentId: number | string,
    gradeId: string,
    config?: AxiosRequestConfig
  ): Promise<void> {
    return ApiService.delete<void>(`/students/${studentId}/grades/${gradeId}`, config);
  }

  static listPeriods(
    courseId: string,
    config?: AxiosRequestConfig
  ): Promise<CoursePeriod[]> {
    return ApiService.get<CoursePeriod[]>(
      `/courses/${courseId}/periods`,
      undefined,
      config
    );
  }
}
