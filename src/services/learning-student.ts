import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------
// ProEduc Learning — área do aluno. Instância axios PRÓPRIA: nunca envia o
// token administrativo nem o school-id; usa só o JWT do aluno (expira).

export const STUDENT_TOKEN_KEY = 'proeduc-student-token';
export const STUDENT_SIGN_IN_PATH = '/aluno/entrar';

export function getStudentToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STUDENT_TOKEN_KEY);
    if (!raw) return null;
    const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: number };
    if (!token || !expiresAt || expiresAt <= Date.now()) {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

export function setStudentToken(token: string, expiresInSeconds: number) {
  localStorage.setItem(STUDENT_TOKEN_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000 }));
}

export function clearStudentToken() {
  if (typeof window !== 'undefined') localStorage.removeItem(STUDENT_TOKEN_KEY);
}

const studentAxios = axios.create({ baseURL: CONFIG.serverUrl });

studentAxios.interceptors.request.use((config) => {
  const token = getStudentToken();
  if (token) (config.headers as any).Authorization = `Bearer ${token}`;
  return config;
});

studentAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message;
    if (typeof message === 'string') error.message = message;
    const url: string = error.config?.url ?? '';
    // Sessão expirada/revogada numa rota autenticada: volta para o login.
    if (error.response?.status === 401 && url.startsWith('/learning/me') && typeof window !== 'undefined') {
      clearStudentToken();
      window.location.href = STUDENT_SIGN_IN_PATH;
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------

export type StudentProfile = {
  id: string;
  studentId: number;
  studentName: string;
  schoolId: string;
  schoolName: string;
  relation: 'student' | 'guardian';
};

export type StudentSession = {
  token: string;
  expiresIn: number;
  account: { id: string; email: string; name?: string | null };
  profile: StudentProfile;
};

export type LoginResult = StudentSession | { needsProfile: true; profiles: StudentProfile[] };

export type TokenInfo = {
  email: string;
  hasPassword: boolean;
  studentName: string | null;
  schoolName: string | null;
  expiresAt: string;
};

export type StudentMe = {
  account: { id: string; email: string | null };
  student: { id: number; name: string };
  school: { id: string; name: string };
  relation: 'student' | 'guardian';
  profiles: { id: string; studentName: string; current: boolean }[];
};

export type ProgressSummary = { totalLessons: number; completedLessons: number; percent: number };

export type MyCourse = ProgressSummary & {
  id: string;
  name: string;
  description: string | null;
  classroomName: string | null;
  moduleCount: number;
  nextLessonId: string | null;
};

export type MyCourseDetail = ProgressSummary & {
  course: { id: string; name: string; description: string | null; workload: number | null };
  classroomName: string | null;
  nextLessonId: string | null;
  modules: (ProgressSummary & {
    id: string;
    title: string;
    description: string | null;
    lessons: { id: string; title: string; type: 'video' | 'text' | 'file'; durationSec: number | null; required: boolean; completed: boolean }[];
  })[];
};

export type MyLesson = ProgressSummary & {
  id: string;
  title: string;
  type: 'video' | 'text' | 'file';
  body: string | null;
  embedUrl: string | null;
  durationSec: number | null;
  required: boolean;
  file: { name: string; size: number | null; mime: string | null; url: string } | null;
  completed: boolean;
  module: { id: string; title: string };
  course: { id: string; name: string };
  previousLessonId: string | null;
  nextLessonId: string | null;
  position: number;
};

export type CompleteResult = ProgressSummary & { lessonId: string; completed: true; nextLessonId: string | null };

const data = <T,>(p: Promise<{ data: T }>) => p.then((r) => r.data);

export const StudentLearningApi = {
  login: (body: { email: string; password: string; profileId?: string }) =>
    data<LoginResult>(studentAxios.post('/learning/auth/login', body)),
  inspectInvite: (token: string) => data<TokenInfo>(studentAxios.post('/learning/auth/invite/inspect', { token })),
  acceptInvite: (token: string, password: string) =>
    data<StudentSession>(studentAxios.post('/learning/auth/invite/accept', { token, password })),
  inspectReset: (token: string) => data<TokenInfo>(studentAxios.post('/learning/auth/reset/inspect', { token })),
  reset: (token: string, password: string) => data<{ email: string }>(studentAxios.post('/learning/auth/reset', { token, password })),
  me: () => data<StudentMe>(studentAxios.get('/learning/me')),
  courses: () => data<MyCourse[]>(studentAxios.get('/learning/me/courses')),
  course: (courseId: string) => data<MyCourseDetail>(studentAxios.get(`/learning/me/courses/${courseId}`)),
  lesson: (lessonId: string) => data<MyLesson>(studentAxios.get(`/learning/me/lessons/${lessonId}`)),
  complete: (lessonId: string) => data<CompleteResult>(studentAxios.post(`/learning/me/lessons/${lessonId}/complete`)),
};
