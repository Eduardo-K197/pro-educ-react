import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/config-global';
import { STORAGE_KEY as JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

export const STORAGE_KEYS = {
  schoolId: 'proeduc-school-id',
  schoolMode: 'proeduc-school-mode',
  user: 'proeduc-user',
  mustChangePassword: 'proeduc-must-change-password',
};

if (!CONFIG.serverUrl || !/^https?:\/\//.test(CONFIG.serverUrl)) {
  // ajuda a detectar o problema cedo
  // eslint-disable-next-line no-console
  console.warn(
    '[axios] CONFIG.serverUrl ausente/relativa. Usando same-origin (ERRADO para API).',
    CONFIG.serverUrl
  );
}

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

axiosInstance.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  const token =
    typeof window !== 'undefined'
      ? sessionStorage.getItem(JWT_STORAGE_KEY) || sessionStorage.getItem('accessToken')
      : null;

  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }

  const schoolId =
    typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.schoolId) : null;

  if (schoolId) {
    // SuperAdmin fora do school-mode não deve filtrar por escola (recebe todas)
    const schoolMode =
      typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.schoolMode) : null;

    let isSuperAdmin = false;
    try {
      const storedUser =
        typeof window !== 'undefined' ? sessionStorage.getItem(STORAGE_KEYS.user) : null;
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      if (parsed?.user?.role === 'superAdmin') isSuperAdmin = true;
    } catch {
      // fall through with isSuperAdmin = false
    }

    if (!isSuperAdmin || schoolMode === 'true') {
      (config.headers as any)['school-id'] = schoolId;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || error)
);

export default axiosInstance;

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];
  const res = await axiosInstance.get(url, { ...config });
  return res.data;
};

// (mantém os endpoints do template)
export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/api/auth/me',
    signIn: '/api/auth/sign-in',
    signUp: '/api/auth/sign-up',
  },
  mail: { list: '/api/mail/list', details: '/api/mail/details', labels: '/api/mail/labels' },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};

// export const endpoints = {
//   chat: '/api/chat',
//   kanban: '/api/kanban',
//   calendar: '/api/calendar',
//   auth: {
//     me: '/api/auth/me',
//     signIn: '/api/auth/sign-in',
//     signUp: '/api/auth/sign-up',
//   },
//   mail: {
//     list: '/api/mail/list',
//     details: '/api/mail/details',
//     labels: '/api/mail/labels',
//   },
//   post: {
//     list: '/api/post/list',
//     details: '/api/post/details',
//     latest: '/api/post/latest',
//     search: '/api/post/search',
//   },
//   product: {
//     list: '/api/product/list',
//     details: '/api/product/details',
//     search: '/api/product/search',
//   },
// };
