export interface TeacherListItem {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  birthDate?: string;
  hourlyProfit?: number;
  createdAt?: string;
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
  phoneNumber: string;   // required na API
  birthDate?: string;
  hourlyProfit?: number;
  courses?: string[];    // array de course IDs
  password?: string;     // usado no create; API usa senha padrão se omitido
}

export interface TeacherUpdatePayload extends Partial<TeacherCreatePayload> {}

export interface ITeacherTableFilters {
  name: string;
}
