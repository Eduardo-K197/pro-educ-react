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
  materials?: { id?: string; name: string; courseId?: string | null; schoolId?: string | null }[];
  modules?: { id?: string; title: string }[];
}

export interface CoursesIndexResponse {
  courses: CourseListItem[];
  total?: number;
  count?: number;
}

export interface CourseCreatePayload {
  name: string;
  description?: string;
  workload?: number;
  teachers?: string[];
  materials?: { id?: string; name: string }[];
  modules?: { id?: string; title: string }[];
}

export interface CourseUpdatePayload extends Partial<CourseCreatePayload> {}

export interface ICourseTableFilters {
  name: string;
}
