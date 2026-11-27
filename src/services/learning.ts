import { ApiService } from './api/api';

// ----------------------------------------------------------------------
// ProEduc Learning — painel do professor/admin (JWT administrativo + school-id)

export type LessonType = 'video' | 'text' | 'file';

export type LearningLesson = {
  id: string;
  moduleId: string;
  order: number;
  type: LessonType;
  title: string;
  body: string | null;
  videoUrl: string | null;
  videoProvider: string | null;
  /** Vídeo próprio (Bunny): uploading | processing | ready | failed. */
  videoStatus: string | null;
  embedUrl: string | null;
  file: { name: string; size: number | null; mime: string | null } | null;
  durationSec: number | null;
  required: boolean;
  published: boolean;
  updatedAt: string | null;
};

export type LearningModule = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  order: number;
  published: boolean;
  lessons: LearningLesson[];
};

export type LearningCourseSummary = {
  id: string;
  name: string;
  description: string | null;
  workload: number | null;
  moduleCount: number;
  publishedModuleCount: number;
  lessonCount: number;
  publishedLessonCount: number;
  canEdit: boolean;
};

export type LearningCourseTree = {
  course: { id: string; name: string; description: string | null; workload: number | null };
  canEdit: boolean;
  modules: LearningModule[];
  classrooms: { id: string; name: string }[];
};

export type LessonInput = {
  type?: LessonType;
  title?: string;
  body?: string | null;
  videoUrl?: string | null;
  durationSec?: number | null;
  required?: boolean;
  published?: boolean;
};

export type ModuleInput = { title?: string; description?: string | null; published?: boolean };

export type ClassroomProgress = {
  classroom: { id: string; name: string };
  course: { id: string; name: string };
  lessons: { id: string; title: string; type: LessonType; required: boolean; moduleId: string; moduleTitle: string }[];
  students: {
    subscriptionId: string;
    studentId: number;
    name: string;
    completedLessonIds: string[];
    completedCount: number;
    percent: number;
    lastCompletedAt: string | null;
  }[];
};

export type StudentAccessAccount = {
  linkId: string;
  accountId: string;
  email: string;
  relation: 'student' | 'guardian';
  hasPassword: boolean;
  revokedAt: string | null;
  createdAt: string | null;
};

export type StudentAccess = {
  student: { id: number; name: string; email: string | null; guardianName: string | null; guardianEmail: string | null };
  accounts: StudentAccessAccount[];
};

export type AccessLink = {
  email: string;
  expiresAt: string;
  path: string;
  url: string | null;
  accountExists?: boolean;
};

/** URL absoluta do link (a API só manda `url` quando LEARNING_APP_URL está configurada). */
export function accessLinkUrl(link: AccessLink) {
  if (link.url) return link.url;
  return typeof window !== 'undefined' ? `${window.location.origin}${link.path}` : link.path;
}

export class LearningService {
  static courses() {
    return ApiService.get<LearningCourseSummary[]>('/learning/courses');
  }

  static course(courseId: string) {
    return ApiService.get<LearningCourseTree>(`/learning/courses/${courseId}`);
  }

  static createModule(courseId: string, body: ModuleInput) {
    return ApiService.post<ModuleInput, LearningModule>(`/learning/courses/${courseId}/modules`, body);
  }

  static updateModule(moduleId: string, body: ModuleInput) {
    return ApiService.put<ModuleInput, LearningModule>(`/learning/modules/${moduleId}`, body);
  }

  static deleteModule(moduleId: string) {
    return ApiService.delete(`/learning/modules/${moduleId}`);
  }

  static reorderModules(courseId: string, ids: string[]) {
    return ApiService.put<{ ids: string[] }, void>(`/learning/courses/${courseId}/modules/order`, { ids });
  }

  static createLesson(moduleId: string, body: LessonInput) {
    return ApiService.post<LessonInput, LearningLesson>(`/learning/modules/${moduleId}/lessons`, body);
  }

  static updateLesson(lessonId: string, body: LessonInput) {
    return ApiService.put<LessonInput, LearningLesson>(`/learning/lessons/${lessonId}`, body);
  }

  static deleteLesson(lessonId: string) {
    return ApiService.delete(`/learning/lessons/${lessonId}`);
  }

  static reorderLessons(moduleId: string, ids: string[]) {
    return ApiService.put<{ ids: string[] }, void>(`/learning/modules/${moduleId}/lessons/order`, { ids });
  }

  static uploadLessonFile(lessonId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    // Sem Content-Type manual: o navegador define o multipart com o boundary.
    return ApiService.post<FormData, LearningLesson>(`/learning/lessons/${lessonId}/file`, form);
  }

  static lessonFileUrl(lessonId: string) {
    return ApiService.get<{ url: string; expiresIn: number }>(`/learning/lessons/${lessonId}/file-url`);
  }

  static classroomProgress(classroomId: string) {
    return ApiService.get<ClassroomProgress>(`/learning/classrooms/${classroomId}/progress`);
  }

  static studentAccess(studentId: number | string) {
    return ApiService.get<StudentAccess>(`/learning/students/${studentId}/access`);
  }

  static invite(studentId: number | string, body: { target: 'student' | 'guardian'; email?: string }) {
    return ApiService.post<typeof body, AccessLink>(`/learning/students/${studentId}/invites`, body);
  }

  static resetLink(studentId: number | string, accountId: string) {
    return ApiService.post<object, AccessLink>(`/learning/students/${studentId}/accounts/${accountId}/reset`, {});
  }

  static revoke(studentId: number | string, linkId: string) {
    return ApiService.delete(`/learning/students/${studentId}/access/${linkId}`);
  }
}

export * from './learning-video';
export * from './learning-assessment';
