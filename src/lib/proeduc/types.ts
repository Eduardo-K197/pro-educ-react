export type Admin = { id: string; name?: string; email: string; groups?: string[] };
export type School = {
  id: string;
  name: string;
  asaasToken?: string;
  asaasSandboxMode?: boolean;
  certInfo?: string;
  groups?: string[];
};
export type Group = { id: string; name: string; schools?: string[]; admins?: string[] };
export type MeResponse = { user: { id: string; name?: string; email: string; role: 'superAdmin'|'admin' } };