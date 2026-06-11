// ── Matéria (nível escola) ──────────────────────────────────────────────
export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  groupId?: string;
}

export interface SubjectCreatePayload {
  name: string;
  code?: string;
}

// ── Grupo de matérias (nível curso) ────────────────────────────────────
export interface SubjectGroup {
  id: string;
  courseId: string;
  schoolId: string;
  name: string;
  subjects?: Subject[];
}

// ── Período letivo (nível curso) ────────────────────────────────────────
export interface CoursePeriod {
  id: string;
  courseId: string;
  schoolId: string;
  name: string;
  shortName?: string;
  order: number;
  weight?: string;
  startAt?: string;
  endAt?: string;
  createdAt?: string;
}

export interface PeriodCreatePayload {
  name: string;
  shortName?: string;
  order?: number;
  weight?: number;
  startAt?: string;
  endAt?: string;
}

// ── Configuração de notas (nível curso) ────────────────────────────────
export interface CourseGradeSetting {
  courseId: string;
  minGrade?: number;
  maxGrade?: number;
  step?: number;
}
