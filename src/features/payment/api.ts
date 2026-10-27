import { apiClient } from '@/lib/api-client';

import type {
  CheckoutResponse, PaymentHistoryItem, PayosReturnPayload, PayosReturnResult, Tier,
} from './types';

export const paymentApi = {
  getTiers: () => apiClient<Tier[]>('/payments/tiers'),

  // BE hien chi doc `tierId` (CreatePaymentRequest) — `platform` bi bo qua nen PayOS
  // redirect ve URL web; man thanh toan tu doi chieu trang thai qua /payments/me khi
  // nguoi dung dong trinh duyet. Van gui `platform` de BE ho tro deep link sau nay.
  checkout: (tierId: string) =>
    apiClient<CheckoutResponse>('/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ tierId, platform: 'mobile' }),
    }),

  // Bao BE biet ket qua PayOS redirect ve (code/id/cancel/status/orderCode tu
  // deep link) de doi chieu ngay, thay vi cho webhook tu xu ly rieng.
  notifyReturn: (payload: PayosReturnPayload) =>
    apiClient<PayosReturnResult>('/payments/payos/return', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Khong co endpoint tra cuu/huy 1 don le — backend chi cho xem toan bo lich
  // su thanh toan cua minh (mang phang, khong phan trang).
  getMyHistory: () => apiClient<PaymentHistoryItem[]>('/payments/me'),
};
