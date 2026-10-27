import type { AssignmentType, StudentAssignment, SubmissionStatus } from './types';

/** Nhom hien thi cua 1 bai tap (giong web student-assignment-card.tsx). */
export type AssignmentBucket = 'TODO' | 'DUE_SOON' | 'OVERDUE' | 'DONE' | 'EXEMPTED';

const DUE_SOON_MS = 48 * 3600 * 1000;

export const isDone = (s: SubmissionStatus) => s === 'SUBMITTED' || s === 'LATE_SUBMITTED';

/** LocalDateTime cua BE khong co mui gio → doc theo gio thiet bi. */
export function parseLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function assignmentBucket(a: StudentAssignment, now = Date.now()): AssignmentBucket {
  if (a.submissionStatus === 'EXEMPTED') return 'EXEMPTED';
  if (isDone(a.submissionStatus)) return 'DONE';
  const due = parseLocal(a.deadline)?.getTime();
  if (a.submissionStatus === 'MISSED' || a.expired || (due !== undefined && due < now)) return 'OVERDUE';
  if (due !== undefined && due - now <= DUE_SOON_MS) return 'DUE_SOON';
  return 'TODO';
}

export const isOpenBucket = (b: AssignmentBucket) => b === 'TODO' || b === 'DUE_SOON' || b === 'OVERDUE';

const BUCKET_ORDER: AssignmentBucket[] = ['DUE_SOON', 'TODO', 'OVERDUE', 'DONE', 'EXEMPTED'];

const dueTime = (a: StudentAssignment) => parseLocal(a.deadline)?.getTime() ?? 0;

export function sortByUrgency(items: StudentAssignment[], now = Date.now()) {
  return [...items].sort((a, b) => {
    const diff = BUCKET_ORDER.indexOf(assignmentBucket(a, now)) - BUCKET_ORDER.indexOf(assignmentBucket(b, now));
    return diff !== 0 ? diff : dueTime(a) - dueTime(b);
  });
}

export function sortByDeadline(items: StudentAssignment[], direction: 'asc' | 'desc') {
  return [...items].sort((a, b) => (direction === 'asc' ? dueTime(a) - dueTime(b) : dueTime(b) - dueTime(a)));
}

export const ASSIGNMENT_TYPE_META: Record<AssignmentType, {
  label: string;
  requirementUnit: string | null;
  defaultRequirement: number | null;
}> = {
  CONTEXT_READING: { label: 'Đọc bối cảnh', requirementUnit: 'giây đọc', defaultRequirement: 60 },
  AI_CHAT_ROLEPLAY: { label: 'Trò chuyện AI', requirementUnit: 'tin nhắn', defaultRequirement: 5 },
  QUIZ_TEST: { label: 'Bài kiểm tra', requirementUnit: null, defaultRequirement: null },
};

export function requirementText(a: Pick<StudentAssignment, 'assignmentType' | 'minRequirement'>) {
  const meta = ASSIGNMENT_TYPE_META[a.assignmentType];
  if (!meta?.requirementUnit) return null;
  return a.minRequirement === null
    ? `${meta.defaultRequirement} ${meta.requirementUnit} (mặc định)`
    : `${a.minRequirement} ${meta.requirementUnit}`;
}

export type StatusTone = 'neutral' | 'warning' | 'success' | 'danger';

export const SUBMISSION_STATUS: Record<SubmissionStatus, { label: string; tone: StatusTone }> = {
  NOT_STARTED: { label: 'Chưa làm', tone: 'neutral' },
  IN_PROGRESS: { label: 'Đang làm', tone: 'warning' },
  SUBMITTED: { label: 'Đã nộp', tone: 'success' },
  LATE_SUBMITTED: { label: 'Nộp muộn', tone: 'warning' },
  MISSED: { label: 'Bỏ lỡ', tone: 'danger' },
  EXEMPTED: { label: 'Được miễn', tone: 'neutral' },
};

/** Chua lam/dang lam ma da qua han thi hien "Quá hạn". */
export function statusBadge(a: StudentAssignment, now = Date.now()): { label: string; tone: StatusTone } {
  if (
    (a.submissionStatus === 'NOT_STARTED' || a.submissionStatus === 'IN_PROGRESS') &&
    assignmentBucket(a, now) === 'OVERDUE'
  ) {
    return { label: 'Quá hạn', tone: 'danger' };
  }
  return SUBMISSION_STATUS[a.submissionStatus] ?? { label: a.submissionStatus, tone: 'neutral' };
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDateTime(value: string | null | undefined) {
  const d = parseLocal(value);
  if (!d) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatShortDate(value: string | null | undefined) {
  const d = parseLocal(value);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : '—';
}

/** "còn 3 giờ" / "quá hạn 2 ngày". */
export function relativeDue(deadline: string, now = Date.now()) {
  const due = parseLocal(deadline)?.getTime();
  if (due === undefined) return '';
  const diff = due - now;
  const minutes = Math.round(Math.abs(diff) / 60000);
  const span = minutes < 60
    ? `${Math.max(minutes, 1)} phút`
    : minutes < 60 * 48
      ? `${Math.round(minutes / 60)} giờ`
      : `${Math.round(minutes / 1440)} ngày`;
  return diff >= 0 ? `còn ${span}` : `quá hạn ${span}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
}

export function formatScore(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) return null;
  return `${score.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} / 10`;
}

export function averageScore(items: StudentAssignment[]) {
  const scored = items.filter((a) => a.score != null && !Number.isNaN(a.score));
  if (!scored.length) return null;
  return scored.reduce((sum, a) => sum + (a.score ?? 0), 0) / scored.length;
}
