'use client';

import { useRef, useEffect } from 'react';

import { StudentLearningApi } from 'src/services/learning-student';

// ----------------------------------------------------------------------
// Tempo assistido no player do Bunny Stream, que fala o protocolo player.js
// por postMessage. Enquanto o vídeo toca, manda um heartbeat a cada 15 s; o
// servidor só credita o tempo real decorrido (pular o vídeo não adianta).

const HEARTBEAT_MS = 15_000;

type Options = {
  lessonId: string;
  enabled: boolean;
  iframe: React.RefObject<HTMLIFrameElement>;
  onCompleted?: () => void;
};

function parse(data: unknown): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data;
}

export function usePlayerWatch({ lessonId, enabled, iframe, onCompleted }: Options) {
  const state = useRef({ seconds: 0, duration: 0, lastUpdate: 0, completed: false });
  const completedRef = useRef(onCompleted);
  completedRef.current = onCompleted;

  useEffect(() => {
    if (!enabled) return undefined;
    state.current = { seconds: 0, duration: 0, lastUpdate: 0, completed: false };
    let origin = '*';
    try {
      ({ origin } = new URL(iframe.current?.src || ''));
    } catch {
      origin = '*';
    }

    const send = (method: string, value?: unknown) =>
      iframe.current?.contentWindow?.postMessage(JSON.stringify({ context: 'player.js', version: '0.0.11', method, value }), origin);

    const onMessage = (event: MessageEvent) => {
      if (origin !== '*' && event.origin !== origin) return;
      const msg = parse(event.data);
      if (!msg || msg.context !== 'player.js') return;
      if (msg.event === 'ready') {
        send('addEventListener', 'timeupdate');
        send('addEventListener', 'ended');
      }
      if (msg.event === 'timeupdate' && msg.value) {
        state.current.seconds = Number(msg.value.seconds) || 0;
        state.current.duration = Number(msg.value.duration) || state.current.duration;
        state.current.lastUpdate = Date.now();
      }
    };

    const beat = () => {
      const s = state.current;
      // Só conta enquanto o player está tocando (timeupdate recente).
      if (s.completed || !s.lastUpdate || Date.now() - s.lastUpdate > HEARTBEAT_MS + 5000) return;
      StudentLearningApi.watch(lessonId, s.seconds, s.duration || undefined)
        .then((r) => {
          if (r.completed && !s.completed) {
            s.completed = true;
            completedRef.current?.();
          }
        })
        .catch(() => {});
    };

    window.addEventListener('message', onMessage);
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    // Caso o "ready" tenha saído antes de registrarmos o listener.
    const retry = window.setTimeout(() => {
      send('addEventListener', 'timeupdate');
      send('addEventListener', 'ended');
    }, 2500);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearInterval(timer);
      window.clearTimeout(retry);
    };
  }, [enabled, lessonId, iframe]);
}
