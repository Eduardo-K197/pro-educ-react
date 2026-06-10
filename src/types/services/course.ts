export interface CourseListItem {
  id: string;
  name: string;
  description?: string;
  workload?: number;
  createdAt?: string;
  teacherCount?: number;
  studentCount?: number;
}

export interface CourseDetail extends CourseListItem {
  teachers?: { id: string; name: string }[];
  subjects?: { id: string; name: string }[];
}

export interface CoursesIndexResponse {
  courses: CourseListItem[];
  total?: number;
}

export interface CourseCreatePayload {
  name: string;
  description?: string;
  workload?: number;
}

export interface CourseUpdatePayload extends Partial<CourseCreatePayload> {}

export interface ICourseTableFilters {
  name: string;
}
