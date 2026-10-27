import { apiClient } from '@/lib/api-client';

import { parseAnswerData, parseQuestionData, parseQuestionType } from './question-data';

import type {
  MyResultsPage,
  Quiz,
  QuizQuestion,
  QuizResult,
  QuizResultDetail,
  QuizResultDetailQuestion,
  QuizSummary,
  SubmitAnswers,
} from './types';

type RawQuestion = Record<string, any>;

function toQuestion(raw: RawQuestion): QuizQuestion {
  return {
    questionId: String(raw.questionId),
    content: raw.content ?? '',
    questionType: parseQuestionType(raw.questionType),
    questionData: parseQuestionData(raw),
    explanation: raw.explanation ?? undefined,
  };
}

export const quizApi = {
  list: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return apiClient<QuizSummary[]>(`/quizzes${qs}`);
  },

  getById: (quizId: string) =>
    apiClient<Quiz>(`/quizzes/${quizId}`),

  startSession: async (quizId: string, limitedTime?: number) => {
    // 0 must still be sent explicitly — it means "no time limit", distinct
    // from omitting the param (which lets the backend fall back to the
    // quiz's own default duration).
    const qs = limitedTime !== undefined ? `?limitedTime=${limitedTime}` : '';
    const session = await apiClient<{ sessionId: string; quizId: string; title: string; questions?: RawQuestion[] }>(
      `/quizzes/${quizId}/start${qs}`,
      { method: 'POST', body: JSON.stringify({}) },
    );
    // BE tra cau hoi theo dung thu tu va khong kem limitedTime (luu phia server).
    return {
      sessionId: session.sessionId,
      quizId: session.quizId ?? quizId,
      title: session.title,
      limitedTime: limitedTime ?? 0,
      questions: (session.questions ?? []).map(toQuestion),
    };
  },

  submit: (data: SubmitAnswers) =>
    apiClient<QuizResult>('/quizzes/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyResults: (page = 0, size = 10, quizId?: string) => {
    const qs = quizId ? `&quizId=${encodeURIComponent(quizId)}` : '';
    return apiClient<MyResultsPage>(
      `/quizzes/results/me?page=${page}&size=${size}${qs}`
    );
  },

  getMyResultBySession: async (sessionId: string): Promise<QuizResultDetail> => {
    const raw = await apiClient<Omit<QuizResultDetail, 'questions'> & { questions?: RawQuestion[] }>(`/quizzes/results/me/${sessionId}`);
    const questions: QuizResultDetailQuestion[] = (raw.questions ?? []).map((q) => ({
      ...toQuestion(q),
      submittedAnswer: q.submittedAnswer && typeof q.submittedAnswer === 'object' ? parseAnswerData(q.submittedAnswer) : null,
      // Jackson serialize `boolean isCorrect` thanh `correct`.
      correct: Boolean(q.isCorrect ?? q.correct),
    }));
    return { ...raw, questions };
  },

  rate: (quizId: string, value: number) =>
    apiClient<{ rating: number; ratingCount: number; myRating: number }>(`/quizzes/${quizId}/rating`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),

  getMyRating: (quizId: string) =>
    apiClient<{ myRating: number | null }>(`/quizzes/${quizId}/rating/me`),

  reportQuestion: (questionId: string, reason?: string) =>
    apiClient<null>(`/quizzes/questions/${questionId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};
