// ----------------------------------------------------------------------
// Upload direto do navegador para o R2/S3 por PUT pré-assinado (XHR, para ter
// progresso). O Content-Type enviado precisa ser o mesmo que a API assinou.

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
};

/** Tipo do arquivo: o do navegador, ou pela extensão quando ele vem vazio/genérico. */
export function fileContentType(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

export function putDirect(
  url: string,
  file: File,
  headers: Record<string, string>,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Falha no envio (HTTP ${xhr.status}).`)));
    xhr.onerror = () => reject(new Error('Falha de rede no envio. Verifique a conexão (ou o CORS do bucket).'));
    signal?.addEventListener('abort', () => {
      xhr.abort();
      reject(new Error('Envio cancelado.'));
    });
    xhr.send(file);
  });
}

/** Duração (s) de um vídeo local, lida antes do envio. */
export function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : undefined);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    video.src = url;
  });
}
