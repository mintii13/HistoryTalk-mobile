export type UserRole =
  | 'CUSTOMER'
  | 'SCHOOL_STUDENT'
  | 'TEACHER'
  | 'SCHOOL_ADMIN'
  | 'CONTENT_ADMIN'
  | 'SYSTEM_ADMIN';

export interface AuthUser {
  uid: string;
  userName: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  uid: string;
  userName: string;
  email: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface UserProfile {
  uid: string;
  userName: string;
  email: string;
  fullName?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
  role: UserRole;
  token: number;
  tierId?: string;
  tierTitle?: string;
  subscriptionEndTime?: string | null;
  lastActiveDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  userName?: string;
  fullName?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
