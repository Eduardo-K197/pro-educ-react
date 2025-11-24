'use client';
import { apiFetch } from './fetcher';
import type { Group, School, Admin } from './types';

export const Groups = {
  list: () => apiFetch<Group[]>('/group?hasPagination=false'),
  get: (id: string) => apiFetch<Group>(`/group/${id}`),
  upsert: (payload: Partial<Group> & { id?: string }) =>
    payload.id
      ? apiFetch<Group>(`/group/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : apiFetch<Group>(`/group`, { method: 'POST', body: JSON.stringify(payload) }),
};

export const Schools = {
  list: () => apiFetch<School[]>('/schools?hasPagination=false'),
  get: (id: string) => apiFetch<School>(`/schools/${id}`),
  upsert: (payload: Partial<School> & { id?: string }) =>
    payload.id
      ? apiFetch<School>(`/schools/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : apiFetch<School>(`/schools`, { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id: string) => apiFetch<{ ok: boolean }>(`/schools/${id}`, { method: 'DELETE' }),
};

export const Admins = {
  list: () => apiFetch<Admin[]>('/admins?hasPagination=false'),
  upsert: (payload: Partial<Admin> & { id?: string }) =>
    payload.id
      ? apiFetch<Admin>(`/admins/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      : apiFetch<Admin>(`/admins`, { method: 'POST', body: JSON.stringify(payload) }),
};