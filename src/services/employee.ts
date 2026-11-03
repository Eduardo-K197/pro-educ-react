import { ApiService } from './api/api';

export type EmployeeItem = {
  id: string;
  email: string;
  name?: string;
  schools?: { id: string; name: string }[];
};
export class EmployeeService {
  static list() {
    return ApiService.get<{ employees: EmployeeItem[] }>('/employees', { hasPagination: false });
  }

  static create(email: string, password: string, schoolId: string) {
    return ApiService.post<{ email: string; password: string; schools: string[] }, EmployeeItem>(
      '/employees',
      { email, password, schools: [schoolId] }
    );
  }
}
