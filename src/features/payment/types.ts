export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'EXPIRED';

export interface Tier {
  tierId: string;
  title: 'free' | 'plus' | 'pro' | string;
  amount: number;
  noMonth: number;
  limitedToken: number;
  isActive: boolean;
}

export interface CheckoutResponse {
  orderId: string;
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  /** So tien thuc tra (= originalAmount - upgradeCreditAmount). */
  amount: number;
  /** Gia niem yet cua goi mua. */
  originalAmount?: number;
  /** Tien quy doi tu goi cu khi nang goi giua ky; 0 neu mua moi. */
  upgradeCreditAmount?: number;
  status: OrderStatus;
  expiredAt: string | null;
}

/** Xem truoc gia mua goi; `upgrade` = true khi thay goi tra phi dang active. */
export interface UpgradeQuote {
  currentTierId: string | null;
  currentTierTitle: string | null;
  currentTierNoMonth: number | null;
  currentEndTime: string | null;
  targetTierId: string;
  targetTierTitle: string;
  targetTierNoMonth: number;
  originalAmount: number;
  creditAmount: number;
  amountToPay: number;
  upgrade: boolean;
}

export interface PaymentHistoryItem {
  orderId: string;
  orderCode: number;
  tierId: string | null;
  tierTitle: string | null;
  amount: number;
  status: OrderStatus;
  paymentLinkId: string;
  createdAt: string;
  paidAt: string | null;
  expiredAt: string | null;
}

// Query params PayOS appends to the deep link it redirects to after checkout.
export interface PayosReturnPayload {
  code: string;
  id: string;
  cancel: boolean;
  status: string;
  orderCode: number;
}

export interface PayosReturnResult {
  orderCode: number;
  resolvedStatus: OrderStatus;
  message: string;
  /** BE hien khong tra (PayOSReturnResponse chi co orderCode/resolvedStatus/message). */
  user?: {
    uid: string;
    tierId: string | null;
    tierTitle: string | null;
    subscriptionEndTime: string | null;
    token: number;
  } | null;
}
