export type ClassroomStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export interface ClassroomTeacher {
  uid: string;
  userName?: string;
  fullName: string;
  email?: string | null;
}

export interface Classroom {
  id: string;
  schoolId?: string;
  schoolName?: string;
  className: string;
  /** vd. "CVA-10A1-2026", BE sinh. */
  classCode: string;
  gradeLevel: number;
  academicYear: number;
  status: ClassroomStatus;
  description?: string | null;
  dailyTokenQuota?: number | null;
  teacher?: ClassroomTeacher | null;
  studentCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export const CLASSROOM_STATUS: Record<ClassroomStatus, { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  ACTIVE: { label: 'Đang học', tone: 'success' },
  INACTIVE: { label: 'Tạm ngừng', tone: 'warning' },
  ARCHIVED: { label: 'Đã lưu trữ', tone: 'neutral' },
};

export const classroomMeta = (c: Pick<Classroom, 'gradeLevel' | 'academicYear'>) =>
  `Khối ${c.gradeLevel} · Năm học ${c.academicYear}`;

export interface DashboardRecentQuizItem {
  sessionId: string;
  quizTitle: string;
  percentage: number;
  completedAt: string;
}

/** GET /student/dashboard */
export interface StudentDashboard {
  studentId: string;
  studentName: string;
  studentCode: string;
  schoolName: string;
  /** Han muc chi tieu moi ngay (lop/truong), chua gom bonus hom nay. */
  dailyTokenLimit?: number;
  /** Token duoc duyet them hom nay. */
  dailyBonusTokens?: number;
  /** Con dung duoc hom nay (gioi han boi quy cua truong). */
  currentTokens: number;
  tokensUsedToday: number;
  totalQuizzesAttempted: number;
  averageScorePercentage: number;
  recentQuizzes: DashboardRecentQuizItem[];
  enrolledClassrooms: {
    classId: string;
    className: string;
    classCode: string;
    academicYear?: number | null;
    status?: string | null;
    teacherName: string | null;
  }[];
}

export type TokenBoostStatus = 'PENDING' | 'PENDING_ADMIN' | 'APPROVED' | 'REJECTED';

export interface TokenBoostRequest {
  id: string;
  classroomId: string | null;
  className: string | null;
  requestedTokens: number;
  approvedTokens: number | null;
  reason: string;
  status: TokenBoostStatus;
  reviewedByName: string | null;
  reviewNote: string | null;
  /** yyyy-MM-dd; token duyet them chi tinh trong ngay nay. */
  requestDate: string;
  createdAt: string;
}

export interface CreateTokenBoostPayload {
  requestedTokens: number;
  reason: string;
}

export const BOOST_MIN_TOKENS = 100;
export const BOOST_MAX_TOKENS = 50_000;
export const BOOST_REASON_MAX = 500;

export const TOKEN_BOOST_STATUS: Record<TokenBoostStatus, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  PENDING: { label: 'Chờ giáo viên', tone: 'warning' },
  PENDING_ADMIN: { label: 'Chờ quản trị trường', tone: 'warning' },
  APPROVED: { label: 'Đã duyệt', tone: 'success' },
  REJECTED: { label: 'Từ chối', tone: 'danger' },
};
