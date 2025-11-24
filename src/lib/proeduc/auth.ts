'use client';
import { apiFetch } from './fetcher';
import type { MeResponse } from './types';

export async function signIn(email: string, password: string) {
  const data = await apiFetch<{ token: string; user: any }>('/sign-in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('proeduc-super-token', data.token);
  }
  return data;
}

export async function me() {
  return apiFetch<MeResponse>('/sign-in', { method: 'GET' });
}