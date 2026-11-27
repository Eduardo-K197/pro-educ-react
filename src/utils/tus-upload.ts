// ----------------------------------------------------------------------
// Cliente TUS 1.0 mínimo (upload retomável direto do navegador para o Bunny
// Stream). A API do ProEduc só assina; o arquivo não passa por ela.

export type TusTicket = { endpoint: string; libraryId: string; videoId: string; expire: number; signature: string };

type Options = {
  file: File;
  ticket: TusTicket;
  title?: string;
  chunkSize?: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

const b64 = (value: string) => btoa(unescape(encodeURIComponent(value)));

async function request(url: string, init: RequestInit, retries = 3): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(url, init);
      if (res.status < 500) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (error) {
      if (init.signal?.aborted) throw error;
      lastError = error;
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
  }
  throw lastError;
}

export async function tusUpload({ file, ticket, title, chunkSize = 8 * 1024 * 1024, onProgress, signal }: Options) {
  const auth = {
    'Tus-Resumable': '1.0.0',
    AuthorizationSignature: ticket.signature,
    AuthorizationExpire: String(ticket.expire),
    VideoId: ticket.videoId,
    LibraryId: String(ticket.libraryId),
  };

  const create = await request(ticket.endpoint, {
    method: 'POST',
    signal,
    headers: {
      ...auth,
      'Upload-Length': String(file.size),
      'Upload-Metadata': `filetype ${b64(file.type || 'video/mp4')},title ${b64(title || file.name)}`,
    },
  });
  if (create.status !== 201) throw new Error(`Falha ao iniciar o envio (HTTP ${create.status}).`);
  const location = new URL(create.headers.get('Location') || '', ticket.endpoint).toString();

  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    // eslint-disable-next-line no-await-in-loop
    let res = await request(location, {
      method: 'PATCH',
      signal,
      headers: { ...auth, 'Upload-Offset': String(offset), 'Content-Type': 'application/offset+octet-stream' },
      body: chunk,
    });
    if (res.status === 409) {
      // Offset divergente (reconexão): pergunta ao servidor onde parou e continua.
      // eslint-disable-next-line no-await-in-loop
      res = await request(location, { method: 'HEAD', signal, headers: auth });
    } else if (res.status !== 204) {
      throw new Error(`Falha no envio (HTTP ${res.status}).`);
    }
    const next = Number(res.headers.get('Upload-Offset'));
    offset = Number.isFinite(next) && next > offset ? next : offset + chunk.size;
    onProgress?.(Math.min(100, Math.round((offset / file.size) * 100)));
  }
}
