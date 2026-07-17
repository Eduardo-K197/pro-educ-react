import type { AxiosRequestConfig } from 'axios';

import axiosInstance from 'src/utils/axios';

export class SicrediService {
  static async pollAll(config?: AxiosRequestConfig): Promise<any> {
    const { data } = await axiosInstance.post('/sicredi/polling/all', {}, config);
    return data;
  }

  static async pollSchool(schoolId: string, config?: AxiosRequestConfig): Promise<any> {
    const { data } = await axiosInstance.post(`/sicredi/polling/school/${schoolId}`, {}, config);
    return data;
  }
}