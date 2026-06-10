export interface TeacherListItem {
  id: string;
  name: string;
  email?: string;
  birthDate?: string;
  hourlyProfit?: number;
  createdAt?: string;
  pictureUrl?: string;
  courses?: { id: string; name: string }[];
}

export interface TeacherDetail extends TeacherListItem {}

export interface TeachersIndexResponse {
  teachers: TeacherListItem[];
  total?: number;
}

export interface TeacherCreatePayload {
  name: string;
  email: string;
  password: string;
  birthDate?: string;
  hourlyProfit?: number;
}

export interface TeacherUpdatePayload extends Partial<Omit<TeacherCreatePayload, 'password'>> {
  password?: string;
}

export interface ITeacherTableFilters {
  name: string;
}
