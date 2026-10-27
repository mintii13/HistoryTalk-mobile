import { router } from "expo-router";
import { LogIn } from "lucide-react-native";

import { ConfirmModal } from "@/components/confirm-modal";
import { ORANGE } from "@/constants/palette";
import { useLoginPromptStore } from "@/features/auth/login-prompt";

// Mounted 1 lan o root layout: khach bam hanh dong can tai khoan thi moi dang nhap (giong web).
export function LoginRequiredModal() {
  const prompt = useLoginPromptStore((s) => s.prompt);
  const close = useLoginPromptStore((s) => s.close);

  return (
    <ConfirmModal
      visible={!!prompt}
      icon={<LogIn size={22} color={ORANGE} />}
      title={prompt?.title ?? ""}
      message={prompt?.message}
      confirmText="Đăng nhập"
      cancelText="Để sau"
      onCancel={close}
      onConfirm={() => {
        close();
        router.push("/login");
      }}
    />
  );
}
