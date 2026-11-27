import { ApiService } from './api/api';

import type { LearningLesson } from './learning';

// ----------------------------------------------------------------------
// F2 — vídeo próprio (Bunny Stream)

export type VideoUploadTicket = {
  lesson: LearningLesson;
  upload: { endpoint: string; libraryId: string; videoId: string; expire: number; signature: string };
};

export class LearningVideoApi {
  static config() {
    return ApiService.get<{ bunny: boolean }>('/learning/video/config');
  }

  static startUpload(lessonId: string, title?: string) {
    return ApiService.post<{ title?: string }, VideoUploadTicket>(`/learning/lessons/${lessonId}/video-upload`, { title });
  }

  static refresh(lessonId: string) {
    return ApiService.post<object, LearningLesson>(`/learning/lessons/${lessonId}/video-refresh`, {});
  }
}

