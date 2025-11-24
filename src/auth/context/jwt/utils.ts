'use client';

import { paths } from 'src/routes/paths';

import axiosInstance from 'src/utils/axios';

import { STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------
// Decode "soft": se não for JWT válido, retorna null em vez de lançar erro
export function jwtDecode(token: string) {
  try {
    if (!token || typeof token !== 'string') return null;
    // token opaco (sem '.'): não é JWT
    if (!token.includes('.')) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // atob pode lançar. envolvemos em try/catch
    const json = atob(base64);
    return JSON.parse(json);
  } catch (error) {
    console.warn('jwtDecode: token não é um JWT válido.', error);
    return null;
  }
}

// ----------------------------------------------------------------------
// Validação "relaxada":
// - Se tiver exp e não expirou -> true
// - Se NÃO tiver exp (token opaco), considera válido se tamanho mínimo ok
export function isValidToken(accessToken: string) {
  if (!accessToken) return false;

  try {
    const decoded: any = jwtDecode(accessToken);

    // é JWT e tem exp
    if (decoded && typeof decoded.exp === 'number') {
      const now = Date.now() / 1000;
      return decoded.exp > now;
    }

    // não é JWT: aceita como válido (compat com backend legado)
    return typeof accessToken === 'string' && accessToken.length >= 16;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------
export function tokenExpired(exp: number) {
  const delay = Math.max(0, exp * 1000 - Date.now());

  setTimeout(() => {
    try {
      // opcional: pode remover o alert se preferir silencioso
      alert('Token expired!');
      sessionStorage.removeItem(STORAGE_KEY);
      delete axiosInstance.defaults.headers.common.Authorization;
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
    }
  }, delay);
}

// ----------------------------------------------------------------------
// NÃO lança erro se faltar exp. Apenas agenda expiração se existir.
export async function setSession(accessToken: string | null) {
  try {
    if (accessToken) {
      sessionStorage.setItem(STORAGE_KEY, accessToken);
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decoded: any = jwtDecode(accessToken);
      if (decoded && typeof decoded.exp === 'number') {
        tokenExpired(decoded.exp);
      } else {
        // token opaco/sem exp -> sem agendamento
        console.info('setSession: token sem exp (opaco). Não será agendada expiração automática.');
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      delete axiosInstance.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
