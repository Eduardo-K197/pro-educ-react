export interface SchoolListItem {
  id: string;
  name: string;
  createdAt: string;
  asaasToken?: string | null;
  asaasHomologationMode?: boolean;
  _certificateFilename?: string | null;
  certificateUrl?: string | null;
  studentCount: number;
  courseCount: number;
  classCount: number;
  teacherCount: number;
  entryOverdueCount: number;
  entryReceivedCount: number;
  entryPendingCount: number;
}

export type ISchoolItem = {
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified?: boolean;
  createdAt: string;
  admins?: SchoolAdmin[];
  groups?: SchoolGroup[];
};

export interface PaginationMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface SchoolsIndexResponse extends PaginationMeta {
  schools: SchoolListItem[];
}

export interface SchoolAdmin {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SchoolEmployee {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SchoolCategory {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SchoolMaterial {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SchoolGroup {
  id: string;
  name: string;
  [key: string]: any;
}

export interface SchoolDetail {
  id: string;
  name: string;
  asaasToken?: string | null;
  asaasSandboxMode?: boolean;
  asaasHomologationMode?: boolean;
  _certificateFilename?: string | null;
  createdAt?: string;

  employees?: SchoolEmployee[];
  categories?: SchoolCategory[];
  materials?: SchoolMaterial[];
  admins?: SchoolAdmin[];
  groups?: SchoolGroup[];

  [key: string]: any;
}

export interface SchoolMaterialInput {
  name: string;
}

export interface SchoolCategoryInput {
  name: string;
}

export interface SchoolCreatePayload {
  name: string;
  asaasToken?: string;
  asaasSandboxMode?: boolean;
  asaasHomologationMode: boolean;
  defaultMaterials?: SchoolMaterialInput[];
  categories?: SchoolCategoryInput[];
  admins?: string[];
  groups?: string[];
}

export interface SchoolUpdatePayload {
  name?: string;
  asaasToken?: string;
  asaasSandboxMode?: boolean;
  materials?: { id?: string; name: string }[];
  categories?: { id?: string; name: string }[];
  admins?: string[];
  employees?: string[];
  groups?: string[];
}
