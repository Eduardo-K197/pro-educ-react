export interface GroupListItem {
  id: string;
  name: string;
  createdAt: string;
  // estrutura baseada no antigo:
  groupSchool: { school: { id: string; name: string } }[];
  groupAdmin: { admin: { id: string; name: string; email: string } }[];
}

export interface GroupDetail extends GroupListItem {}

export interface GroupCreatePayload {
  name: string;
  admins: string[];
  schools: string[];
}

export interface GroupUpdatePayload {
  name?: string;
  admins?: string[];
  schools?: string[];
}
