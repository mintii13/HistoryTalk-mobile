import { create } from 'axios';

import type { ApiResponse, AuthResponse, RefreshTokenResponse } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/Historical-tell/api/v1';

const http = create({ baseURL: BASE_URL, validateStatus: () => true });

function parseJsonResponse<T>(data: unknown, status: number, path: string): ApiResponse<T> | null {
  if (data === '' || data === undefined || data === null) return null;
  if (typeof data === 'string') {
    const preview = data.replace(/\s+/g, ' ').trim().slice(0, 120);
    throw new Error(`API trả về dữ liệu không phải JSON (${status}) tại ${BASE_URL}${path}: ${preview}`);
  }
  return data as ApiResponse<T>;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await http.post(path, body, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = parseJsonResponse<T>(res.data, res.status, path);
  if (res.status < 200 || res.status >= 300) {
    const message = json?.message || 'Request failed';
    // Giong web AuthForm: tai khoan bi vo hieu hoa (vd. hoc sinh da tot nghiep / chuyen truong).
    if (/^\s*ACCOUNT_DEACTIVATED\s*:/.test(message)) {
      throw new Error('Tài khoản đã bị vô hiệu hóa (ví dụ học sinh đã tốt nghiệp hoặc chuyển trường). Liên hệ nhà trường để được hỗ trợ.');
    }
    throw new Error(message.replace(/^\s*[A-Z][A-Z_]+[A-Z]\s*:\s*/, ''));
  }
  return json?.data as T;
}

export const authApi = {
  login: (email: string, password: string) =>
    post<AuthResponse>('/auth/login', { email, password }),

  register: (userName: string, email: string, password: string, confirmPassword: string) =>
    post<null>('/auth/register', { userName, email, password, confirmPassword }),

  googleLogin: (idToken: string) =>
    post<AuthResponse>('/auth/google', { idToken }),

  refreshToken: (refreshToken: string) =>
    post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken }),

  // Gui kem refresh token de BE thu hoi no (khong thi token van song toi khi het han).
  logout: (accessToken: string, refreshToken?: string | null) =>
    post<null>('/auth/logout', refreshToken ? { refreshToken } : {}, accessToken),

  forgotPassword: (email: string) =>
    post<null>('/auth/forgot-password', { email }),
};
