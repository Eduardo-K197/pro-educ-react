export interface LessonListItem {
  id: string;
  name?: string;
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
  total?: number;
}

export interface LessonCreatePayload {
  courseId: string;
  teacherId: string;
  classroomId?: string;
  date?: string;
  name?: string;
}

export interface LessonUpdatePayload extends Partial<LessonCreatePayload> {}

export interface ILessonTableFilters {
  name: string;
}
