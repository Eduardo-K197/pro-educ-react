export interface ClassroomListItem {
  id: string;
  name: string;
  course?: { id: string; name: string };
  studentCount?: number;
  maxStudentCount?: number;
  createdAt?: string;
}

export interface ClassroomDetail extends ClassroomListItem {
  students?: { id: number; name: string }[];
  classes?: { id: string; name: string }[];
}

export interface ClassroomsIndexResponse {
  classrooms: ClassroomListItem[];
  total?: number;
}

export interface ClassroomCreatePayload {
  name: string;
  courseId?: string;
}

export interface ClassroomUpdatePayload extends Partial<ClassroomCreatePayload> {}

export interface IClassroomTableFilters {
  name: string;
}
