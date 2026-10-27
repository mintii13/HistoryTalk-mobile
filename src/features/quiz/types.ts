import type { AnswerData, QuestionData, QuestionType } from './question-data';

export type QuizLevel = 'EASY' | 'MEDIUM' | 'HARD';
export type QuizEra = 'ALL' | 'ANCIENT' | 'MEDIEVAL' | 'MODERN' | 'CONTEMPORARY';
export type QuizGrade = 10 | 11 | 12;

export interface QuizSummary {
  quizId: string;
  title: string;
  level: QuizLevel;
  era: QuizEra;
  playCount: number;
  rating?: number;
  contextTitle?: string;
  contextId?: string;
  /** Co trong danh sach khi BE tra ve; the quiz hien "x phut" neu co. */
  durationSeconds?: number;
}

export interface Quiz extends QuizSummary {
  description?: string;
  durationSeconds?: number;
  rating?: number;
  ratingCount?: number;
  /** Danh gia (1-5) cua chinh nguoi dung hien tai cho quiz nay — null neu chua danh gia. */
  myRating?: number | null;
  grade?: QuizGrade;
  chapterNumber?: number;
  chapterTitle?: string;
  /** So lan chinh nguoi dung hien tai da hoan thanh quiz nay (rieng, khac playCount toan he thong). */
  userPlayCount?: number;
}

export interface QuizQuestion {
  questionId: string;
  content: string;
  questionType: QuestionType;
  /** Learner nhan ban da luoc dap an khi bat dau; man ket qua nhan ban day du. */
  questionData: QuestionData;
  explanation?: string;
}

export interface QuizSession {
  sessionId: string;
  quizId: string;
  title: string;
  /** BE khong tra limitedTime khi start — app tu gan theo gia tri da yeu cau (0 = khong gioi han). */
  limitedTime: number;
  questions: QuizQuestion[];
}

export interface SubmitAnswers {
  sessionId: string;
  answers: { questionId: string; answerData: AnswerData }[];
}

export interface QuizResult {
  resultId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  startTime: string;
  endTime: string;
  correctAnswers: number[];
  wrongAnswers: number[];
}

export interface MyResult {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

export interface MyResultsPage {
  content: MyResult[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface QuizResultDetailQuestion extends QuizQuestion {
  submittedAnswer: AnswerData | null;
  correct: boolean;
}

export interface PreviousAttempt {
  score: number;
  percentage: number;
  completedAt: string;
}

export interface QuizResultDetail {
  sessionId: string;
  quizId: string;
  quizTitle: string;
  contextId?: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  limitedTime: number;
  startedAt: string;
  completedAt: string;
  previousAttempt?: PreviousAttempt | null;
  questions: QuizResultDetailQuestion[];
}
