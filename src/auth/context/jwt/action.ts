'use client';

import axios from 'src/utils/axios';

import { setSession } from './utils';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export type SignInParams = { email: string; password: string };
export type SignUpParams = { email: string; password: string; firstName: string; lastName: string };

const buildUrl = (p: string) => `${API_BASE.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;

/** Login -> POST /sign-in (pega o token e só) */
export const signInWithPassword = async ({ email, password }: SignInParams): Promise<void> => {
  try {
    const res = await axios.post(buildUrl('/sign-in'), { email, password });
    const d: any = (res && (res as any).data !== undefined ? (res as any).data : res) || {};
    const token: string =
      d.token ?? d.access_token ?? d.accessToken ?? d.data?.token ?? d.data?.access_token ?? d.data?.accessToken;

    if (!token || typeof token !== 'string' || token.length < 10) {
      throw new Error('Invalid access token!');
    }

    await setSession(token); // injeta Authorization no axios + salva em sessionStorage
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || String(err);
    throw new Error(msg.startsWith('<') ? '  Falha no login. Verifique a URL da API.' : msg);
  }
};

/** Opcional: /sign-up se existir */
export const signUp = async ({ email, password, firstName, lastName }: SignUpParams): Promise<void> => {
  const res = await axios.post(buildUrl('/sign-up'), { email, password, firstName, lastName });
  const d: any = (res && (res as any).data !== undefined ? (res as any).data : res) || {};
  const token: string =
    d.token ?? d.access_token ?? d.accessToken ?? d.data?.token ?? d.data?.access_token ?? d.data?.accessToken;
  if (!token) throw new Error('Invalid access token!');
  await setSession(token);
};

/** GET “me” -> GET /sign-in (devolve user + schools) */
export const getUserFromSession = async () => {
  const res = await axios.get(buildUrl('/sign-in'));
  const d: any = (res && (res as any).data !== undefined ? (res as any).data : res) || {};
  return d; // { user, schools, ... }
};

/** Logout */
export const signOut = async (): Promise<void> => {
  await setSession(null);
};
