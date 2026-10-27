export type AssignmentType = 'CONTEXT_READING' | 'AI_CHAT_ROLEPLAY' | 'QUIZ_TEST';

export type SubmissionStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'LATE_SUBMITTED'
  | 'MISSED'
  | 'EXEMPTED';

export interface StudentAssignment {
  assignmentId: string;
  classroomId: string;
  className: string;
  title: string;
  description: string | null;
  assignmentType: AssignmentType;
  targetId: string;
  targetTitle: string | null;
  /** LocalDateTime khong kem mui gio — doc theo gio thiet bi. */
  deadline: string;
  minRequirement: number | null;
  submissionStatus: SubmissionStatus;
  /** Thang 10, BE tu cham khi nop. */
  score: number | null;
  messageCount: number | null;
  readingDurationSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  expired: boolean;
}

export interface StudentSubmission {
  submissionId: string;
  assignmentId: string;
  status: SubmissionStatus;
  score: number | null;
  messageCount: number | null;
  readingDurationSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
}

export interface StudentAssignmentListParams {
  classroomId?: string;
  status?: SubmissionStatus;
  page?: number;
  size?: number;
}

export interface SubmitAssignmentPayload {
  quizSessionId?: string;
  chatSessionId?: string;
}

export interface AssignmentPage {
  items: StudentAssignment[];
  totalElements: number;
}
