import type { AuthResponse, UserRole } from './types';

/** App mobile chi danh cho nguoi hoc: khach hang (B2C) va hoc sinh cua truong (B2B). */
export const MOBILE_ROLES: readonly UserRole[] = ['CUSTOMER', 'SCHOOL_STUDENT'];

export const ROLE_LABELS: Record<UserRole, string> = {
  CUSTOMER: 'Người dùng',
  SCHOOL_STUDENT: 'Học sinh',
  TEACHER: 'Giáo viên',
  SCHOOL_ADMIN: 'Quản trị trường',
  CONTENT_ADMIN: 'Quản trị nội dung',
  SYSTEM_ADMIN: 'Quản trị hệ thống',
};

export const isMobileRole = (role: string | undefined | null): boolean =>
  !!role && (MOBILE_ROLES as readonly string[]).includes(role);

export const isSchoolStudent = (role: string | undefined | null): boolean => role === 'SCHOOL_STUDENT';

export const isCustomer = (role: string | undefined | null): boolean => role === 'CUSTOMER';

export const unsupportedRoleMessage = (role: string | undefined | null) =>
  `Tài khoản ${ROLE_LABELS[role as UserRole] ?? role ?? ''} chỉ dùng được trên website HistoryTalk. App mobile dành cho người học và học sinh.`;

/** Goi trong mutationFn dang nhap: chan role khong dung app mobile truoc khi luu phien. */
export async function assertMobileRole(
  data: AuthResponse,
  logout: (token: string, refreshToken?: string) => Promise<unknown>,
) {
  if (isMobileRole(data.role)) return data;
  try { await logout(data.accessToken, data.refreshToken); } catch { /* best-effort */ }
  throw new Error(unsupportedRoleMessage(data.role));
}
