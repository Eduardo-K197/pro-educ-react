export interface LessonListItem {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  details?: string;
  teacher?: { id: string; name: string };
  course?: { id: string; name: string };
  classroom?: { id: string; name: string };
  createdAt?: string;
}

export interface LessonDetail extends LessonListItem {
  presences?: { studentId: number; studentName: string; present: boolean }[];
}

export interface LessonsIndexResponse {
  classes: LessonListItem[];
  count?: number;
  total?: number;
}

// Campos exatos aceitos pela API (ClassController)
export interface LessonCreatePayload {
  classroom: string;   // classroom ID
  teacher: string;     // teacher ID
  date: string;        // required
  startTime: string;   // required, formato HH:MM
  endTime: string;     // required, formato HH:MM
  status: string;      // required
  details?: string;    // opcional
}

export interface LessonUpdatePayload extends Partial<LessonCreatePayload> {}

export interface ILessonTableFilters {
  name: string;
}
