import { create } from 'axios';

import { authApi } from '@/features/auth/api';
import { reportPlatformLock } from '@/features/auth/platform-lock';
import { useAuthStore } from '@/features/auth/store';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/Historical-tell/api/v1';

const http = create({ baseURL: BASE_URL, validateStatus: () => true });

interface ApiClientOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export interface PaginationMeta {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Loi tu API, giu lai HTTP status de man hinh phan biet 403/404/409... */
export class ApiError extends Error {
  status: number;
  /** Ma loi BE gan o dau message, vd. AI_QUOTA_EXCEEDED. */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** BE gan ma loi o dau message, vd. "AI_QUOTA_EXCEEDED: ..." — bo ma de hien cho nguoi dung. */
const ERROR_CODE_PREFIX = /^\s*([A-Z][A-Z_]+[A-Z])\s*:\s*/;

export function stripErrorCode(message: string) {
  return message.replace(ERROR_CODE_PREFIX, '');
}

export function errorCodeOf(message: string): string | undefined {
  return ERROR_CODE_PREFIX.exec(message)?.[1];
}

function extractJson(data: unknown, status: number, path: string): any {
  if (data === '' || data === undefined || data === null) return null;
  if (typeof data === 'string') {
    const preview = data.replace(/\s+/g, ' ').trim().slice(0, 120);
    throw new ApiError(`API trả về dữ liệu không phải JSON (${status}) tại ${BASE_URL}${path}: ${preview}`, status);
  }
  return data;
}

function firstFieldError(json: any): string | undefined {
  const errors = json?.errors;
  if (!errors || typeof errors !== 'object') return undefined;
  const first = Object.values(errors)[0];
  return Array.isArray(first) ? String(first[0] ?? '') || undefined : first ? String(first) : undefined;
}

async function request(path: string, options: ApiClientOptions): Promise<any> {
  const { skipAuth = false, method = 'GET', body, headers } = options;

  const doRequest = async () => {
    const token = useAuthStore.getState().accessToken;
    return http.request({
      url: path,
      method,
      data: body,
      headers: {
        'Content-Type': 'application/json',
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  };

  let res = await doRequest();

  // Khach (chua dang nhap) goi endpoint can token: bao can dang nhap, khong bao "het phien".
  if (res.status === 401 && !skipAuth && !useAuthStore.getState().isAuthenticated) {
    throw new ApiError('Bạn cần đăng nhập để sử dụng tính năng này.', 401);
  }

  // Token hết hạn → thử refresh
  if (res.status === 401 && !skipAuth) {
    const storedRefresh = useAuthStore.getState().refreshToken;
    if (storedRefresh) {
      try {
        const tokens = await authApi.refreshToken(storedRefresh);
        useAuthStore.getState().updateTokens(tokens.accessToken, tokens.refreshToken);
        res = await doRequest();
      } catch {
        void useAuthStore.getState().logout('expired');
        throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
      }
    } else {
      void useAuthStore.getState().logout('expired');
      throw new ApiError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
    }
  }

  const json = extractJson(res.data, res.status, path);
  if (res.status < 200 || res.status >= 300) {
    const message = typeof json?.message === 'string' ? json.message : '';
    // Tai khoan bi vo hieu hoa / truong het han goi: khoa toan app giong web.
    if (res.status === 403) reportPlatformLock(message);
    throw new ApiError(
      firstFieldError(json) ?? (message ? stripErrorCode(message) : 'Yêu cầu thất bại'),
      res.status,
      errorCodeOf(message),
    );
  }
  return json;
}

export async function apiClient<T>(path: string, options: ApiClientOptions = {}): Promise<T> {
  const json = await request(path, options);
  return json?.data as T;
}

/** Giong apiClient nhung giu ca `pagination` cua envelope (vd. /student/assignments). */
export async function apiClientWithMeta<T>(
  path: string,
  options: ApiClientOptions = {},
): Promise<{ data: T; pagination: PaginationMeta | null }> {
  const json = await request(path, options);
  return { data: json?.data as T, pagination: (json?.pagination as PaginationMeta | undefined) ?? null };
}
