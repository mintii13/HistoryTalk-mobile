import type { Tier } from '@/features/payment/types';

export type BillingCycle = 'month' | 'year';

/** One plan (free / plus / pro) with its monthly and yearly tier rows from /payments/tiers. */
export interface TierPlan {
  key: string;
  title: string;
  isFree: boolean;
  monthly?: Tier;
  yearly?: Tier;
  /** Tokens added per day — the same for both billing cycles of a plan. */
  dailyTokens: number;
}

/** Yearly rows share the monthly row's title and are told apart by noMonth = 12. */
export function groupTierPlans(tiers: Tier[]): TierPlan[] {
  const plans = new Map<string, TierPlan>();
  for (const tier of tiers) {
    if (!tier.isActive) continue;
    const key = tier.title.trim().toLowerCase();
    const plan = plans.get(key) ?? { key, title: tier.title.trim(), isFree: tier.amount <= 0, dailyTokens: tier.limitedToken };
    if (tier.noMonth >= 12) plan.yearly = tier;
    else plan.monthly = tier;
    plan.isFree = plan.isFree && tier.amount <= 0;
    plan.dailyTokens = Math.max(plan.dailyTokens, tier.limitedToken);
    plans.set(key, plan);
  }
  const sortPrice = (p: TierPlan) => (p.monthly ?? p.yearly)?.amount ?? 0;
  return [...plans.values()].sort((a, b) => sortPrice(a) - sortPrice(b));
}

/** The tier to sell for a cycle; falls back to the other cycle when a plan only has one. */
export function tierForCycle(plan: TierPlan, cycle: BillingCycle): Tier | undefined {
  return cycle === 'year' ? plan.yearly ?? plan.monthly : plan.monthly ?? plan.yearly;
}

/** Percent saved by paying yearly instead of 12 monthly payments, or null when not cheaper. */
export function yearlySavingPercent(plan: TierPlan): number | null {
  if (!plan.monthly || !plan.yearly || plan.monthly.amount <= 0) return null;
  const fullYear = plan.monthly.amount * 12;
  const saving = Math.round(((fullYear - plan.yearly.amount) / fullYear) * 100);
  return saving > 0 ? saving : null;
}

export function hasYearlyPlans(plans: TierPlan[]): boolean {
  return plans.some((p) => !!p.yearly);
}

/** "49.000đ" — grouped by hand so it does not depend on the device's Intl data. */
export function formatVnd(amount: number): string {
  return `${groupThousands(Math.max(0, amount))}đ`;
}

export function groupThousands(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
