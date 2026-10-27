import { useMutation, useQueryClient } from '@tanstack/react-query';

import { paymentApi } from '../api';

export function useNotifyPayosReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: paymentApi.notifyReturn,
    // Thanh cong hay that bai (webhook van la nguon su that) deu lam moi don hang + so du.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
