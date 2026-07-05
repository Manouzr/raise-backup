import type { Plan, SubscriptionStatus } from "@/lib/db/schema";

// Catalogue d'abonnements — source de vérité côté produit (le prix réel est
// géré en base / plus tard par Stripe). Ordre = échelle de montée en gamme.

export const PLANS: Record<Plan, { label: string; priceEUR: number; blurb: string; features: string[] }> = {
  chasseur: {
    label: "Hunter",
    priceEUR: 0,
    blurb: "1 category scanned",
    features: ["1 category scanned", "Market rate refreshed weekly", "3 alerts per month"],
  },
  pro: {
    label: "Pro",
    priceEUR: 19,
    blurb: "Unlimited categories, real-time rate",
    features: [
      "Unlimited categories",
      "Real-time rate + sub-models",
      "Live bid suggestions",
      "Journal & memory of your decisions",
    ],
  },
  equipe: {
    label: "Team",
    priceEUR: 49,
    blurb: "Organization, roles & shared budget",
    features: ["Everything in Pro", "Organization: roles & members", "Shared budget, team caps", "Shared radar and categories"],
  },
};

export const PLAN_ORDER: Plan[] = ["chasseur", "pro", "equipe"];

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past due",
  suspended: "Suspended",
  canceled: "Canceled",
};

/** Jours restants avant la fin d'essai (négatif si dépassé, null si pas d'essai). */
export function trialDaysLeft(trialEndsAt: Date | string | null): number | null {
  if (!trialEndsAt) return null;
  const end = typeof trialEndsAt === "string" ? new Date(trialEndsAt) : trialEndsAt;
  return Math.ceil((end.getTime() - Date.now()) / (24 * 3600 * 1000));
}

export function planPriceLabel(plan: Plan): string {
  return `€${PLANS[plan].priceEUR}`;
}
