import type { Plan, SubscriptionStatus } from "@/lib/db/schema";

// Catalogue d'abonnements — source de vérité côté produit (le prix réel est
// géré en base / plus tard par Stripe). Ordre = échelle de montée en gamme.

export const PLANS: Record<Plan, { label: string; priceEUR: number; blurb: string; features: string[] }> = {
  chasseur: {
    label: "Chasseur",
    priceEUR: 0,
    blurb: "1 catégorie scannée",
    features: ["1 catégorie scannée", "Cote rafraîchie chaque semaine", "3 alertes par mois"],
  },
  pro: {
    label: "Pro",
    priceEUR: 19,
    blurb: "Catégories illimitées, cote temps réel",
    features: [
      "Catégories illimitées",
      "Cote en temps réel + sous-modèles",
      "Suggestions d'enchères en direct",
      "Journal & mémoire de tes décisions",
    ],
  },
  equipe: {
    label: "Équipe",
    priceEUR: 49,
    blurb: "Organisation, rôles & budget partagé",
    features: ["Tout Pro", "Organisation : rôles & membres", "Budget partagé, plafonds d'équipe", "Radar et catégories partagés"],
  },
};

export const PLAN_ORDER: Plan[] = ["chasseur", "pro", "equipe"];

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trialing: "Essai",
  active: "Actif",
  past_due: "Impayé",
  suspended: "Suspendu",
  canceled: "Résilié",
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
