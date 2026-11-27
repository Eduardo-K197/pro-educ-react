import { ApiService } from './api/api';

// ----------------------------------------------------------------------
// F3/F4 — avaliações, correção e feedback

export type QuestionType = 'single' | 'multiple' | 'true_false' | 'short' | 'essay';
export type QuestionOption = { id: string; text: string };

export type Question = {
  id: string;
  assessmentId: string | null;
  order: number;
  type: QuestionType;
  prompt: string;
  options: QuestionOption[] | null;
  answerKey: unknown;
  points: number;
  explanation: string | null;
};

export type QuestionInput = {
  type?: QuestionType;
  prompt?: string;
  options?: { id?: string; text: string }[];
  answerKey?: unknown;
  points?: number;
  explanation?: string | null;
};

export type Assessment = {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  description: string | null;
  kind: string;
  weight: number;
  subjectId: string | null;
  periodId: string | null;
  maxAttempts: number;
  timeLimitMin: number | null;
  availableFrom: string | null;
  dueAt: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  gradingPolicy: 'highest' | 'last';
  syncGrade: boolean;
  published: boolean;
  resultsReleasedAt: string | null;
};

export type AssessmentSummary = Assessment & { questionCount: number; totalPoints: number; attemptCount: number; pendingCount: number };

export type AssessmentInput = Partial<Omit<Assessment, 'id' | 'courseId' | 'resultsReleasedAt'>>;

export type AttemptSummary = {
  id: string;
  assessmentId: string;
  subscriptionId: string;
  studentId: number;
  studentName: string | null;
  number: number;
  status: 'in_progress' | 'submitted' | 'graded';
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  gradedAt: string | null;
};

export type QueueItem = AttemptSummary & { assessmentTitle: string; courseId: string; courseName: string };

export type Feedback = {
  id: string;
  subscriptionId: string;
  studentId: number;
  attemptId: string | null;
  lessonId: string | null;
  authorId: string;
  authorName: string | null;
  body: string;
  aiDraft: string | null;
  visibleToStudent: boolean;
  createdAt: string | null;
};

export type AttemptAnswer = {
  questionId: string;
  response: unknown;
  isCorrect: boolean | null;
  autoScore: number | null;
  manualScore: number | null;
  aiSuggestedScore: number | null;
  aiRationale: string | null;
  aiDraft: string | null;
  gradedAt: string | null;
};

export type AttemptDetail = {
  assessment: { id: string; title: string; courseId: string };
  attempt: AttemptSummary;
  questions: (Question & { answer: AttemptAnswer | null; pending: boolean })[];
  feedback: Feedback[];
};

export type AssessmentResults = {
  assessment: Assessment;
  students: { subscriptionId: string; studentId: number; studentName: string; grade: number | null; attempts: AttemptSummary[] }[];
};

export class LearningAssessmentApi {
  static list(courseId: string) {
    return ApiService.get<{ canEdit: boolean; assessments: AssessmentSummary[] }>(`/learning/courses/${courseId}/assessments`);
  }

  static create(courseId: string, body: AssessmentInput) {
    return ApiService.post<AssessmentInput, Assessment>(`/learning/courses/${courseId}/assessments`, body);
  }

  static get(id: string) {
    return ApiService.get<{ assessment: Assessment; course: { id: string; name: string }; canEdit: boolean; hasSubmissions: boolean; questions: Question[] }>(
      `/learning/assessments/${id}`
    );
  }

  static update(id: string, body: AssessmentInput) {
    return ApiService.put<AssessmentInput, Assessment>(`/learning/assessments/${id}`, body);
  }

  static remove(id: string) {
    return ApiService.delete(`/learning/assessments/${id}`);
  }

  static release(id: string, released: boolean) {
    return ApiService.post<{ released: boolean }, Assessment>(`/learning/assessments/${id}/release`, { released });
  }

  static addQuestion(id: string, body: QuestionInput) {
    return ApiService.post<QuestionInput, Question>(`/learning/assessments/${id}/questions`, body);
  }

  static updateQuestion(questionId: string, body: QuestionInput) {
    return ApiService.put<QuestionInput, Question>(`/learning/questions/${questionId}`, body);
  }

  static deleteQuestion(questionId: string) {
    return ApiService.delete(`/learning/questions/${questionId}`);
  }

  static reorderQuestions(id: string, ids: string[]) {
    return ApiService.put<{ ids: string[] }, void>(`/learning/assessments/${id}/questions/order`, { ids });
  }

  static bank(courseId: string) {
    return ApiService.get<Question[]>(`/learning/courses/${courseId}/question-bank`);
  }

  static addBankQuestion(courseId: string, body: QuestionInput) {
    return ApiService.post<QuestionInput, Question>(`/learning/courses/${courseId}/question-bank`, body);
  }

  static copyQuestions(id: string, questionIds: string[]) {
    return ApiService.post<{ questionIds: string[] }, Question[]>(`/learning/assessments/${id}/questions/copy`, { questionIds });
  }

  static results(id: string) {
    return ApiService.get<AssessmentResults>(`/learning/assessments/${id}/results`);
  }

  static attempt(attemptId: string) {
    return ApiService.get<AttemptDetail>(`/learning/attempts/${attemptId}`);
  }

  static grade(attemptId: string, scores: { questionId: string; manualScore: number | null }[]) {
    return ApiService.post<{ scores: typeof scores }, AttemptSummary & { pending: number }>(`/learning/attempts/${attemptId}/grade`, { scores });
  }

  static queue() {
    return ApiService.get<QueueItem[]>('/learning/grading-queue');
  }

  static createFeedback(body: { attemptId?: string; lessonId?: string; subscriptionId?: string; body: string; visibleToStudent?: boolean }) {
    return ApiService.post<typeof body, Feedback>('/learning/feedback', body);
  }

  static updateFeedback(id: string, body: { body?: string; visibleToStudent?: boolean }) {
    return ApiService.put<typeof body, Feedback>(`/learning/feedback/${id}`, body);
  }

  static deleteFeedback(id: string) {
    return ApiService.delete(`/learning/feedback/${id}`);
  }
}
