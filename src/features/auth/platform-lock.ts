import { create } from 'zustand';

/**
 * Khoa toan app khi BE tra 403 kem ma loi (giong web src/lib/utils/school-lock.ts):
 * - ACCOUNT_DEACTIVATED (hoac "Tài khoản của bạn đã bị vô hiệu hóa"): tai khoan bi khoa.
 * - SCHOOL_SUBSCRIPTION_EXPIRED / SCHOOL_SUBSCRIPTION_NOT_STARTED: goi nam hoc cua truong.
 * AI_QUOTA_EXCEEDED khong khoa app — chi khoa tro chuyen AI (xu ly o man chat).
 */
export type PlatformLockKind = 'ACCOUNT_DEACTIVATED' | 'SCHOOL_SUBSCRIPTION_EXPIRED' | 'SCHOOL_SUBSCRIPTION_NOT_STARTED';

const LOCK_CODE = /^\s*(SCHOOL_SUBSCRIPTION_EXPIRED|SCHOOL_SUBSCRIPTION_NOT_STARTED|ACCOUNT_DEACTIVATED)\s*:\s*/;
const DEACTIVATED_MESSAGE = 'Tài khoản của bạn đã bị vô hiệu hóa';

interface PlatformLockState {
  kind: PlatformLockKind | null;
  /** Message BE da bo ma loi. */
  detail: string | null;
  clear: () => void;
}

export const usePlatformLockStore = create<PlatformLockState>((set) => ({
  kind: null,
  detail: null,
  clear: () => set({ kind: null, detail: null }),
}));

export function parsePlatformLock(message: string | undefined | null): { kind: PlatformLockKind; detail: string } | null {
  if (!message) return null;
  if (message.trim() === DEACTIVATED_MESSAGE) return { kind: 'ACCOUNT_DEACTIVATED', detail: message };
  const match = LOCK_CODE.exec(message);
  if (!match) return null;
  return { kind: match[1] as PlatformLockKind, detail: message.replace(LOCK_CODE, '') };
}

/** Goi tu api-client khi gap 403. Tra true neu da mo modal khoa. */
export function reportPlatformLock(message: string | undefined | null): boolean {
  const lock = parsePlatformLock(message);
  if (!lock) return false;
  usePlatformLockStore.setState({ kind: lock.kind, detail: lock.detail });
  return true;
}
