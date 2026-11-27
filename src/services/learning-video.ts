import { ApiService } from './api/api';

import type { LearningLesson } from './learning';

// ----------------------------------------------------------------------
// F2 — vídeo próprio (Bunny Stream)

export type LearningMediaConfig = {
  bunny: boolean;
  storage: boolean;
  directFiles: boolean;
  fileMaxBytes: number;
  videoMaxBytes: number | null;
};

export type DirectUploadTicket = {
  key: string;
  method: 'PUT';
  uploadUrl: string;
  headers: Record<string, string>;
  expiresIn: number;
  maxBytes: number;
};

export type VideoUploadTicket = {
  lesson: LearningLesson;
  upload: { endpoint: string; libraryId: string; videoId: string; expire: number; signature: string };
};

export class LearningVideoApi {
  /** Opções disponíveis: link externo sempre; Bunny e MP4 no R2 (storage) conforme o .env da API. */
  static config() {
    return ApiService.get<LearningMediaConfig>('/learning/video/config');
  }

  /** Upload direto ao R2/S3: pede a URL PUT pré-assinada. */
  static requestUpload(lessonId: string, kind: 'file' | 'video', file: { fileName: string; contentType: string; size: number }) {
    return ApiService.post<object, DirectUploadTicket>(`/learning/lessons/${lessonId}/uploads`, { kind, ...file });
  }

  /** Confirma o envio (a API confere o objeto no bucket) e grava na aula. */
  static confirmUpload(lessonId: string, kind: 'file' | 'video', body: { key: string; fileName?: string; durationSec?: number }) {
    return ApiService.post<object, LearningLesson>(`/learning/lessons/${lessonId}/uploads/confirm`, { kind, ...body });
  }

  static startUpload(lessonId: string, title?: string) {
    return ApiService.post<{ title?: string }, VideoUploadTicket>(`/learning/lessons/${lessonId}/video-upload`, { title });
  }

  static refresh(lessonId: string) {
    return ApiService.post<object, LearningLesson>(`/learning/lessons/${lessonId}/video-refresh`, {});
  }
}

