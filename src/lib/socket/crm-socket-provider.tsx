'use client';

import type { Socket } from 'socket.io-client';

import {
  useRef,
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
} from 'react';

import { createCrmSocket, readCrmSocketCredentials } from './crm-socket';

// ----------------------------------------------------------------------

export type CrmSocketStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export type CrmReadyPayload = {
  schoolId: string;
  userId: string;
  userType: string;
  role: string | null;
  departmentIds: string[];
  serverTime: string;
};

type CrmSocketContextValue = {
  socket: Socket | null;
  status: CrmSocketStatus;
  error: string | null;
  ready: CrmReadyPayload | null;
  attempts: number;
  reconnect: () => void;
};

const CrmSocketContext = createContext<CrmSocketContextValue | undefined>(undefined);

/** Erros de autorização não adiantam repetir: o servidor vai recusar de novo. */
const isAuthError = (err: any) => [400, 401, 403].includes(Number(err?.data?.status));

const MAX_BACKOFF_MS = 30000;

type Props = {
  children: React.ReactNode;
  /** false mantém o socket desligado (ex.: usuário sem acesso ao CRM). */
  enabled?: boolean;
};

export function CrmSocketProvider({ children, enabled = true }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<CrmSocketStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<CrmReadyPayload | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [generation, setGeneration] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return undefined;
    }

    const credentials = readCrmSocketCredentials();
    if (!credentials) {
      setStatus('error');
      setError('Sessão ou escola não selecionada.');
      return undefined;
    }

    const s = createCrmSocket(credentials);
    let failures = 0;
    setSocket(s);
    setStatus('connecting');
    setError(null);

    const clearRetry = () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = null;
    };

    s.on('connect', () => {
      failures = 0;
      setAttempts(0);
      setStatus('connected');
      setError(null);
    });

    s.on('crm:ready', (payload: CrmReadyPayload) => setReady(payload));

    s.on('disconnect', (reason) => {
      // "io client disconnect" = encerramos nós mesmos (desmontagem).
      if (reason === 'io client disconnect') return;
      setStatus('reconnecting');
    });

    s.io.on('reconnect_attempt', (n) => {
      setAttempts(n);
      setStatus('reconnecting');
    });

    s.on('connect_error', (err: any) => {
      setError(err?.message || 'Falha ao conectar');

      if (isAuthError(err)) {
        setStatus('error');
        return;
      }

      // Erro vindo do middleware do servidor desliga a reconexão automática
      // (socket.active === false); nesse caso tentamos de novo com backoff.
      if (!s.active) {
        failures += 1;
        setAttempts(failures);
        setStatus('reconnecting');
        clearRetry();
        const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(failures, 5));
        retryTimer.current = setTimeout(() => s.connect(), delay);
      } else {
        setStatus('reconnecting');
      }
    });

    s.connect();

    return () => {
      clearRetry();
      s.removeAllListeners();
      s.io.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setReady(null);
    };
  }, [generation, enabled]);

  const reconnect = useCallback(() => setGeneration((g) => g + 1), []);

  const value = useMemo(
    () => ({ socket, status, error, ready, attempts, reconnect }),
    [socket, status, error, ready, attempts, reconnect]
  );

  return <CrmSocketContext.Provider value={value}>{children}</CrmSocketContext.Provider>;
}

export function useCrmSocket() {
  const context = useContext(CrmSocketContext);
  if (!context) throw new Error('useCrmSocket deve ser usado dentro de CrmSocketProvider');
  return context;
}

/** Assina um evento do namespace /crm enquanto o componente estiver montado. */
export function useCrmSocketEvent<T = unknown>(event: string, handler: (payload: T) => void) {
  const { socket } = useCrmSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (payload: T) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}
