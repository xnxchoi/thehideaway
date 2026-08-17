/**
 * Static pricing-card contract retained while membership commerce is
 * disconnected. The page keeps its existing rendering seam and can receive
 * real plans again without coupling it to the retired schema.
 */
export type ResolvedPrice = {
  amount: number;
  currency: string;
  display: string;
};

export type ResolvedPlan = {
  id: string;
  name: string;
  tier: "resident" | "patron" | "cofounder";
  tier_label: string;
  validity: "yearly" | "lifetime";
  description: string;
  features: { label: string; included: boolean }[];
  discount_label: string | null;
  price: ResolvedPrice;
  payment_methods: ("card" | "bank_transfer" | "cash")[];
  seat_limit: number | null;
  seats_taken: number;
  seats_remaining: number | null;
  sold_out: boolean;
  sort: number;
};

export async function getPlansData(): Promise<ResolvedPlan[]> {
  return [];
}
