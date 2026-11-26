import type { Socket } from 'socket.io-client';

import { io } from 'socket.io-client';

import { STORAGE_KEYS } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { STORAGE_KEY as JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

export type CrmSocketCredentials = { token: string; schoolId: string };

/** Mesmas fontes de credencial usadas pelo axios (sessionStorage). */
export function readCrmSocketCredentials(): CrmSocketCredentials | null {
  if (typeof window === 'undefined') return null;
  const token = sessionStorage.getItem(JWT_STORAGE_KEY) || sessionStorage.getItem('accessToken');
  const schoolId = sessionStorage.getItem(STORAGE_KEYS.schoolId);
  if (!token || !schoolId) return null;
  return { token, schoolId };
}

/**
 * Origem e path do socket.io a partir de NEXT_PUBLIC_SERVER_URL.
 * Ex.: https://api.exemplo.com/v1 -> origem https://api.exemplo.com, path /v1/socket.io.
 * NEXT_PUBLIC_SOCKET_URL / NEXT_PUBLIC_SOCKET_PATH sobrescrevem, se definidos.
 */
export function resolveSocketEndpoint(serverUrl: string = CONFIG.serverUrl) {
  // Acesso literal (sem destructuring) para o Next embutir as variáveis no bundle.
  const overrideUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  const overridePath = process.env.NEXT_PUBLIC_SOCKET_PATH;

  let origin = overrideUrl || '';
  let basePath = '';

  try {
    const { origin: serverOrigin, pathname } = new URL(serverUrl);
    origin = origin || serverOrigin;
    basePath = pathname.replace(/\/+$/, '');
  } catch {
    if (!origin && typeof window !== 'undefined') {
      const { origin: pageOrigin } = window.location;
      origin = pageOrigin;
    }
  }

  return { origin, path: overridePath || `${basePath}/socket.io` };
}

export function createCrmSocket({ token, schoolId }: CrmSocketCredentials): Socket {
  const { origin, path } = resolveSocketEndpoint();

  return io(`${origin}/crm`, {
    path,
    auth: { token, schoolId },
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    randomizationFactor: 0.5,
  });
}
