import type {
  Subject,
  SubjectCreatePayload,
  SubjectGroup,
  CoursePeriod,
  PeriodCreatePayload,
  CourseGradeSetting,
} from 'src/types/services/curriculum';

import { ApiService } from './api/api';

export class CurriculumService {
  // ── Matérias da escola ────────────────────────────────────────────────
  static listSubjects(schoolId: string): Promise<Subject[]> {
    return ApiService.get<Subject[]>(`/schools/${schoolId}/subjects`);
  }

  static createSubject(schoolId: string, payload: SubjectCreatePayload): Promise<Subject> {
    return ApiService.post<SubjectCreatePayload, Subject>(
      `/schools/${schoolId}/subjects`,
      payload
    );
  }

  static updateSubject(schoolId: string, id: string, payload: Partial<SubjectCreatePayload>): Promise<Subject> {
    return ApiService.put<Partial<SubjectCreatePayload>, Subject>(
      `/schools/${schoolId}/subjects/${id}`,
      payload
    );
  }

  static deleteSubject(schoolId: string, id: string): Promise<void> {
    return ApiService.delete<void>(`/schools/${schoolId}/subjects/${id}`);
  }

  // ── Matérias vinculadas ao curso ──────────────────────────────────────
  static listCourseSubjects(courseId: string): Promise<{ subjects: Subject[] }> {
    return ApiService.get<{ subjects: Subject[] }>(`/courses/${courseId}/subjects`);
  }

  static linkSubjectToCourse(courseId: string, subjectId: string): Promise<void> {
    return ApiService.post<Record<string, never>, void>(
      `/courses/${courseId}/subjects/${subjectId}`,
      {}
    );
  }

  static unlinkSubjectFromCourse(courseId: string, subjectId: string): Promise<void> {
    return ApiService.delete<void>(`/courses/${courseId}/subjects/${subjectId}`);
  }

  // ── Grupos de matérias do curso ───────────────────────────────────────
  static listSubjectGroups(courseId: string): Promise<SubjectGroup[]> {
    return ApiService.get<SubjectGroup[]>(`/courses/${courseId}/subject-groups`);
  }

  static createSubjectGroup(courseId: string, name: string): Promise<SubjectGroup> {
    return ApiService.post<{ name: string }, SubjectGroup>(
      `/courses/${courseId}/subject-groups`,
      { name }
    );
  }

  static updateSubjectGroup(courseId: string, id: string, name: string): Promise<SubjectGroup> {
    return ApiService.put<{ name: string }, SubjectGroup>(
      `/courses/${courseId}/subject-groups/${id}`,
      { name }
    );
  }

  static deleteSubjectGroup(courseId: string, id: string): Promise<void> {
    return ApiService.delete<void>(`/courses/${courseId}/subject-groups/${id}`);
  }

  static addSubjectsToGroup(courseId: string, groupId: string, subjectIds: string[]): Promise<void> {
    return ApiService.post<{ subjectIds: string[] }, void>(
      `/courses/${courseId}/subject-groups/${groupId}/subjects`,
      { subjectIds }
    );
  }

  // ── Períodos do curso ─────────────────────────────────────────────────
  static listPeriods(courseId: string): Promise<CoursePeriod[]> {
    return ApiService.get<CoursePeriod[]>(`/courses/${courseId}/periods`);
  }

  static createPeriod(courseId: string, payload: PeriodCreatePayload): Promise<CoursePeriod> {
    return ApiService.post<PeriodCreatePayload, CoursePeriod>(
      `/courses/${courseId}/periods`,
      payload
    );
  }

  static updatePeriod(courseId: string, id: string, payload: Partial<PeriodCreatePayload>): Promise<CoursePeriod> {
    return ApiService.put<Partial<PeriodCreatePayload>, CoursePeriod>(
      `/courses/${courseId}/periods/${id}`,
      payload
    );
  }

  static deletePeriod(courseId: string, id: string): Promise<void> {
    return ApiService.delete<void>(`/courses/${courseId}/periods/${id}`);
  }

  // ── Configuração de notas ─────────────────────────────────────────────
  static getGradeSetting(courseId: string): Promise<CourseGradeSetting> {
    return ApiService.get<CourseGradeSetting>(`/courses/${courseId}/grade-setting`);
  }

  static saveGradeSetting(courseId: string, payload: Omit<CourseGradeSetting, 'courseId'>): Promise<CourseGradeSetting> {
    return ApiService.put<Omit<CourseGradeSetting, 'courseId'>, CourseGradeSetting>(
      `/courses/${courseId}/grade-setting`,
      payload
    );
  }
}
