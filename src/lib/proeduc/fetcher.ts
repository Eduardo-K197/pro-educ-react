'use client';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('proeduc-super-token');
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, cache: 'no-store' });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('proeduc-super-token');
      window.location.href = '/auth/jwt/sign-in';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
