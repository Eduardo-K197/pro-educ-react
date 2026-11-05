export interface StudentGuardianAddress {
  zipCode?: string;
  country?: string;
  state?: string;
  city?: string;
  county?: string;  // bairro
  street?: string;
  number?: string;
  complement?: string;
  reference?: string;
}

export interface StudentGuardian {
  id?: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
  relationship?: string;
  cpf?: string;
  rg?: string;
  address?: StudentGuardianAddress;
}

export interface StudentFamilyContact { type:'father'|'mother'|'other'; name:string; relationship?:string; phoneNumber?:string; email?:string; cpf?:string; rg?:string; address?:StudentGuardianAddress; }
export interface StudentListItem {
  tags?:string[];
  familyContacts?:StudentFamilyContact[];
  additionalInformation?:string;

  id: number;
  name: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  picture?: { id?: string; url?: string; fileName?: string };
  birthDate?: string;
  gender?: string;
  status?: string;
  cpf?: string;
  createdAt?: string;
  schoolId?: string;
  subscriptions?: Array<{
    id: string;
    classroom?: { id: string; name: string; course?: { id: string; name: string } };
    course?: { id: string; name: string };
    status?: string;
  }>;
}

export interface StudentDetail extends StudentListItem {
  rg?: string;
  address?: StudentGuardianAddress | string;
  guardian?: StudentGuardian;
  subscriptions?: StudentSubscription[];
  picture?: { id?: string; url?: string; fileName?: string };
  pictureUrl?: string;
}

export interface StudentSubscription {
  id: string;
  classroom?: { id: string; name: string; course?: { id: string; name: string } };
  course?: { id: string; name: string };
  status?: string;
  createdAt?: string;
  deletedAt?: string | null;
}

export interface StudentsIndexResponse {
  students: StudentListItem[];
  total?: number;
  count?: number;
  page?: number;
  perPage?: number;
  totalPages?: number;
}

export interface StudentCreatePayload {
 tags?:string[]; familyContacts?:StudentFamilyContact[]; additionalInformation?:string; phoneNumber?:string;

  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  cpf?: string;
  rg?: string;
  address?: StudentGuardianAddress | string;
  guardian?: StudentGuardian;
  status?: string;
}

export interface StudentUpdatePayload extends Partial<StudentCreatePayload> {}

export interface IStudentTableFilters {
  name: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
}
