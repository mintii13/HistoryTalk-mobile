import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { authApi } from '../api';
import { assertMobileRole } from '../roles';
import { useAuthStore } from '../store';
import type { LoginInput } from '../schemas';

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async ({ email, password }: LoginInput) =>
      assertMobileRole(await authApi.login(email, password), authApi.logout),
    onSuccess: async (data) => {
      await setAuth(data);
      router.replace('/');
    },
  });
}
