export interface ClassroomListItem {
  id: string;
  name: string;
  course?: { id: string; name: string };
  studentCount?: number;
  maxStudentCount?: number;
  minStudentAge?: number;
  startAt?: string;
  createdAt?: string;
}

export interface ClassroomDetail extends ClassroomListItem {
  teachers?: { id: string; name: string }[];
  subscriptions?: { id: string; student: { id: number; name: string; email?: string; status?: string } }[];
  classes?: { id: string; date?: string; details?: string }[];
}

export interface ClassroomsIndexResponse {
  classrooms: ClassroomListItem[];
  count?: number;
  total?: number;
}

// Campos exatos aceitos pela API (ClassroomController)
export interface ClassroomCreatePayload {
  name: string;
  course?: string;           // course ID (API usa "course", não "courseId")
  startAt: string;           // required, data de início
  maxStudentCount?: number;
  minStudentAge?: number;
  teachers?: string[];       // array de teacher IDs
}

export interface ClassroomUpdatePayload extends Partial<ClassroomCreatePayload> {}

export interface IClassroomTableFilters {
  name: string;
}
