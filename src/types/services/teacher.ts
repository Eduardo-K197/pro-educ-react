export interface TeacherListItem {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  startDate?: string;
  observations?: string;
  hourlyProfit?: number;
  createdAt?: string;
  picture?: { id?: string; url?: string; fileName?: string };
  pictureUrl?: string;
  courses?: { id: string; name: string }[];
}

export interface TeacherDetail extends TeacherListItem {}

export interface TeachersIndexResponse {
  teachers: TeacherListItem[];
  count?: number;
  total?: number;
}

// Campos exatos aceitos pela API (TeacherController)
export interface TeacherCreatePayload {
  name: string;
  email: string;
  phoneNumber: string;
  birthDate?: string;
  startDate?: string;
  observations?: string;
  hourlyProfit?: number;
  courses?: string[];
  password?: string;
}

export interface TeacherUpdatePayload extends Partial<TeacherCreatePayload> {}

export interface ITeacherTableFilters {
  name: string;
}
