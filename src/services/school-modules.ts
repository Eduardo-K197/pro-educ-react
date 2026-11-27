import { ApiService } from './api/api';

export type SchoolModuleName = 'crm' | 'growth';

export type SchoolModuleInfo = {
  module: SchoolModuleName;
  label: string;
  description?: string | null;
  enabled: boolean;
  enabledAt: string | null;
  disabledAt: string | null;
  updatedAt: string | null;
};

/** Módulos pagos por escola (ChatFlow = crm, Growth = growth). */
export class SchoolModuleService {
  /** Módulos da escola atual (header school-id). */
  static current(): Promise<{ schoolId: string; modules: Record<SchoolModuleName, boolean> }> {
    return ApiService.get('/school-modules');
  }

  /** Super admin: módulos de uma escola. */
  static list(schoolId: string): Promise<SchoolModuleInfo[]> {
    return ApiService.get<SchoolModuleInfo[]>(`/schools/${schoolId}/modules`);
  }

  /** Super admin: liga/desliga um módulo. */
  static set(schoolId: string, module: SchoolModuleName, enabled: boolean): Promise<SchoolModuleInfo> {
    return ApiService.put<{ enabled: boolean }, SchoolModuleInfo>(`/schools/${schoolId}/modules/${module}`, { enabled });
  }
}
