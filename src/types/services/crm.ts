export type CrmRole = 'agente' | 'supervisor' | 'gestor';
export type CrmUserType = 'admin' | 'employee' | 'teacher';

export type CrmMe = {
  schoolId: string;
  user: { type: CrmUserType | 'superAdmin'; id: string; name?: string };
  role: CrmRole | null;
  implicit: boolean;
  memberId: string | null;
  departmentIds: string[];
  roles: CrmRole[];
  permissions: { access: boolean; supervise: boolean; manage: boolean };
  realtime: { path: string; namespace: string };
  features: { queues: boolean; redis: boolean };
};

export type CrmDepartment = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CrmDepartmentPayload = {
  name?: string;
  description?: string | null;
  active?: boolean;
};

export type CrmMember = {
  id: string;
  userType: CrmUserType;
  userId: string;
  name: string | null;
  email: string | null;
  role: CrmRole;
  active: boolean;
  departments: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
};

export type CrmMemberCreatePayload = {
  userType: CrmUserType;
  userId: string;
  role: CrmRole;
  active?: boolean;
  departmentIds?: string[];
};

export type CrmMemberUpdatePayload = {
  role?: CrmRole;
  active?: boolean;
  departmentIds?: string[];
};

export type CrmCandidate = {
  userType: CrmUserType;
  userId: string;
  name: string;
  email?: string;
};

export const CRM_ROLE_LABELS: Record<CrmRole, string> = {
  agente: 'Agente',
  supervisor: 'Supervisor',
  gestor: 'Gestor',
};

export const CRM_USER_TYPE_LABELS: Record<CrmUserType, string> = {
  admin: 'Administrador',
  employee: 'Funcionário',
  teacher: 'Professor',
};
