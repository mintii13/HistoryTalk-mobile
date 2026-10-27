import { useQueryClient } from "@tanstack/react-query";
import { Lock, School } from "lucide-react-native";

import { ConfirmModal } from "@/components/confirm-modal";
import { RED } from "@/constants/palette";
import { usePlatformLockStore } from "@/features/auth/platform-lock";
import { useAuthStore } from "@/features/auth/store";

const COPY = {
  ACCOUNT_DEACTIVATED: {
    title: "Tài khoản đã bị vô hiệu hóa",
    message:
      "Tài khoản của bạn hiện không còn sử dụng được (ví dụ học sinh đã tốt nghiệp hoặc chuyển trường). Liên hệ nhà trường hoặc HistoryTalk nếu bạn cho rằng đây là nhầm lẫn.",
  },
  SCHOOL_SUBSCRIPTION_EXPIRED: {
    title: "Gói năm học của trường đã hết hạn",
    message:
      "Nền tảng tạm khóa với tài khoản trường bạn. Vui lòng liên hệ Quản trị viên nhà trường để gia hạn gói năm học mới (01/09 – 31/05).",
  },
  SCHOOL_SUBSCRIPTION_NOT_STARTED: {
    title: "Năm học mới chưa bắt đầu",
    message:
      "Gói năm học của nhà trường sẽ được kích hoạt từ ngày 01/09. Nền tảng tạm khóa trong thời gian nghỉ hè.",
  },
} as const;

/**
 * Mounted 1 lan o root layout (giong SchoolLockDialog / UserLockedDialog ben web):
 * khong dong duoc, tai khoan bi khoa chi co nut quay lai dang nhap; truong bi khoa
 * co "Thử lại" (tai lai du lieu) va "Đăng xuất".
 */
export function PlatformLockModal() {
  const kind = usePlatformLockStore((s) => s.kind);
  const detail = usePlatformLockStore((s) => s.detail);
  const clear = usePlatformLockStore((s) => s.clear);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  if (!kind) return null;
  const copy = COPY[kind];
  const accountLocked = kind === "ACCOUNT_DEACTIVATED";
  const extra = !accountLocked && detail && detail !== copy.message ? `\n\n${detail}` : "";

  async function signOut() {
    clear();
    queryClient.clear();
    await logout();
  }

  return (
    <ConfirmModal
      visible
      variant="danger"
      icon={accountLocked ? <Lock size={22} color={RED} /> : <School size={22} color={RED} />}
      title={copy.title}
      message={`${copy.message}${extra}`}
      confirmText={accountLocked ? "Quay lại đăng nhập" : "Thử lại"}
      cancelText={accountLocked ? undefined : "Đăng xuất"}
      onConfirm={() => {
        if (accountLocked) {
          void signOut();
          return;
        }
        clear();
        void queryClient.invalidateQueries();
      }}
      onCancel={accountLocked ? undefined : () => void signOut()}
    />
  );
}
