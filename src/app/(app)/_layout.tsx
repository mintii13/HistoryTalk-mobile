import { Redirect, usePathname } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { UnsupportedRoleScreen } from '@/components/unsupported-role-screen';
import { isMobileRole } from '@/features/auth/roles';
import { useAuthStore } from '@/features/auth/store';

// Giong web: khach xem duoc trang chu, nhan vat, boi canh, quiz, ban do, bang gia.
// Cac trang du lieu ca nhan duoi day bat buoc dang nhap.
const AUTH_REQUIRED = [
  '/chat', '/classes', '/assignments', '/grades',
  '/quiz/play', '/quiz/result', '/quiz/history',
  '/payment/history', '/payment/result', '/map/class',
];

function requiresAuth(pathname: string) {
  return AUTH_REQUIRED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Nhóm route chính: bọc mọi màn hình trong tab bar tuỳ biến (AppTabs).
export default function AppLayout() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated && requiresAuth(pathname)) {
    return <Redirect href="/(auth)/login" />;
  }

  // Phien cu (luu tu truoc) cua role khong dung app mobile: chi cho dang xuat.
  if (isAuthenticated && !isMobileRole(role)) {
    return <UnsupportedRoleScreen role={role} />;
  }

  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}
