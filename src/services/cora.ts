import type { AxiosRequestConfig } from 'axios';

import axiosInstance from 'src/utils/axios';

export interface CoraSetupPayload {
  schoolId?: string;
  schoolName?: string;
  clientId: string;
  environment: 'homolog' | 'production';
  accountName: string;
  certificate: File;
  privateKey: File;
  categories?: { name: string }[];
  defaultMaterials?: { name: string }[];
}

export class CoraService {
  static async pollAll(config?: AxiosRequestConfig): Promise<any> {
    const { data } = await axiosInstance.post('/cora/polling/all', {}, config);
    return data;
  }

  static async pollSchool(schoolId: string, config?: AxiosRequestConfig): Promise<any> {
    const { data } = await axiosInstance.post(`/cora/polling/school/${schoolId}`, {}, config);
    return data;
  }

  static async setup(payload: CoraSetupPayload, config?: AxiosRequestConfig): Promise<any> {
    const form = new FormData();

    form.append('certificate', payload.certificate);
    form.append('privateKey', payload.privateKey);
    form.append('clientId', payload.clientId);
    form.append('environment', payload.environment);
    form.append('accountName', payload.accountName);

    if (payload.schoolId) {
      form.append('schoolId', payload.schoolId);
    } else if (payload.schoolName) {
      form.append('schoolName', payload.schoolName);
    }

    if (payload.categories?.length) {
      form.append('categories', JSON.stringify(payload.categories));
    }

    if (payload.defaultMaterials?.length) {
      form.append('defaultMaterials', JSON.stringify(payload.defaultMaterials));
    }

    const { data } = await axiosInstance.post('/cora/setup', form, {
      ...config,
      headers: { ...(config?.headers ?? {}), 'Content-Type': 'multipart/form-data' },
    });

    return data;
  }
}
