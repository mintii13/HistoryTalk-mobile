import { useMutation } from '@tanstack/react-query';

import { paymentApi } from '../api';

/** Xem truoc gia nang goi giua ky, goi ngay truoc khi tao don PayOS. */
export function useUpgradeQuote() {
  return useMutation({
    mutationFn: (tierId: string) => paymentApi.getUpgradeQuote(tierId),
  });
}
