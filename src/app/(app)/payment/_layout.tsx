import { Redirect, Slot } from 'expo-router';

import { useAuthStore } from '@/features/auth/store';

// Chi khach hang (B2C) mua goi; tai khoan truong nhan han muc token tu nha truong (giong web).
export default function PaymentLayout() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'SCHOOL_STUDENT') return <Redirect href="/profile" />;
  return <Slot />;
}
