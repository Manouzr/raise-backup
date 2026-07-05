import type { BidAdvisory, JournalEntry } from "@/lib/contracts";

// lib/taste — le journal (localStorage) est réinjecté dans chaque advisory.
// Le serveur calcule l'advisory sans learnsFrom ; le client le fusionne ici.
// Note : le préfixe interne "appris : " des `learn` est un marqueur retiré avant
// affichage (remplacé par le libellé i18n) — jamais montré tel quel.

export const SEED_JOURNAL: JournalEntry[] = [
  {
    id: "seed-rtx4080",
    ts: Date.now() - 3 * 24 * 3600 * 1000,
    lotTitle: "RTX 4080 Super",
    categoryLabel: "GPU / graphics cards",
    platformLabel: "eBay",
    outcome: "lost",
    price: 510,
    learn: "appris : holds the line — discipline confirmed",
    gradient: "linear-gradient(140deg,#2e2b3d,#131020)",
    meta: "GPU · 3d ago · eBay",
  },
  {
    id: "seed-ddr5-32",
    ts: Date.now() - 7 * 24 * 3600 * 1000,
    lotTitle: "DDR5 32GB RAM kit",
    categoryLabel: "DDR5 RAM / components",
    platformLabel: "Catawiki",
    outcome: "passed",
    price: null,
    learn: "appris : skip kits without a heatspreader",
    gradient: "linear-gradient(140deg,#1c3a2a,#0c1710)",
    meta: "RAM · last week · Catawiki",
  },
  {
    id: "seed-skx007",
    ts: Date.now() - 8 * 24 * 3600 * 1000,
    lotTitle: "Seiko SKX007",
    categoryLabel: "Vintage Seiko watches",
    platformLabel: "Drouot",
    outcome: "won",
    price: 118,
    learn: "appris : never above market, even for a favorite",
    gradient: "linear-gradient(140deg,#39404d,#12151b)",
    meta: "Watches · last week · Drouot",
  },
  {
    id: "seed-omega-deville",
    ts: Date.now() - 14 * 24 * 3600 * 1000,
    lotTitle: "Omega De Ville 1966",
    categoryLabel: "Vintage watches",
    platformLabel: "Drouot",
    outcome: "passed",
    price: null,
    learn: "appris : prefers serviced movements",
    gradient: "linear-gradient(140deg,#4a3f33,#171310)",
    meta: "Watches · 2w ago · Drouot",
  },
];

/**
 * Cherche dans le journal un motif pertinent pour ce lot et le formule en
 * une phrase de rappel. Retourne undefined si rien d'utile.
 */
export function learnsFrom(
  journal: JournalEntry[],
  advisory: BidAdvisory,
  categoryLabel?: string,
): string | undefined {
  if (journal.length === 0) return undefined;

  const sameCategory = categoryLabel
    ? journal.filter((e) => e.categoryLabel === categoryLabel)
    : [];
  const pool = sameCategory.length > 0 ? sameCategory : journal;

  const won = pool.find((e) => e.outcome === "won" && e.price !== null);
  if (won && won.price !== null) {
    return `You won "${won.lotTitle}" at €${won.price} by staying under market — same discipline here, cap €${advisory.userCeiling}.`;
  }

  const lost = pool.find((e) => e.outcome === "lost" && e.price !== null);
  if (lost && lost.price !== null) {
    return `You held your limit on "${lost.lotTitle}" last time — I suggest keeping €${advisory.userCeiling} as the cap here.`;
  }

  const passed = pool.find((e) => e.outcome === "passed");
  if (passed) {
    return `You passed on "${passed.lotTitle}" — ${passed.learn.replace("appris : ", "")}.`;
  }

  return undefined;
}

/** Fusionne le rappel du journal dans l'advisory reçu du serveur. */
export function withTaste(
  advisory: BidAdvisory,
  journal: JournalEntry[],
  categoryLabel?: string,
): BidAdvisory {
  return { ...advisory, learnsFrom: learnsFrom(journal, advisory, categoryLabel) };
}
