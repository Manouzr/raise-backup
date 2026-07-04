import type { BidAdvisory, JournalEntry } from "@/lib/contracts";

// lib/taste — le journal (localStorage) est réinjecté dans chaque advisory.
// Le serveur calcule l'advisory sans learnsFrom ; le client le fusionne ici.

export const SEED_JOURNAL: JournalEntry[] = [
  {
    id: "seed-rtx4080",
    ts: Date.now() - 3 * 24 * 3600 * 1000,
    lotTitle: "RTX 4080 Super",
    categoryLabel: "GPU / cartes graphiques",
    platformLabel: "eBay",
    outcome: "lost",
    price: 510,
    learn: "appris : tient sa limite — discipline confirmée",
    gradient: "linear-gradient(140deg,#2e2b3d,#131020)",
    meta: "GPU · il y a 3 j · eBay",
  },
  {
    id: "seed-ddr5-32",
    ts: Date.now() - 7 * 24 * 3600 * 1000,
    lotTitle: "Kit RAM DDR5 32 Go",
    categoryLabel: "RAM DDR5 / composants",
    platformLabel: "Catawiki",
    outcome: "passed",
    price: null,
    learn: "appris : ignore les kits sans dissipateur",
    gradient: "linear-gradient(140deg,#1c3a2a,#0c1710)",
    meta: "RAM · sem. dernière · Catawiki",
  },
  {
    id: "seed-skx007",
    ts: Date.now() - 8 * 24 * 3600 * 1000,
    lotTitle: "Seiko SKX007",
    categoryLabel: "Montres Seiko vintage",
    platformLabel: "Drouot",
    outcome: "won",
    price: 118,
    learn: "appris : jamais au-dessus de la cote, même coup de cœur",
    gradient: "linear-gradient(140deg,#39404d,#12151b)",
    meta: "Montres · sem. dernière · Drouot",
  },
  {
    id: "seed-omega-deville",
    ts: Date.now() - 14 * 24 * 3600 * 1000,
    lotTitle: "Omega De Ville 1966",
    categoryLabel: "Montres vintage",
    platformLabel: "Drouot",
    outcome: "passed",
    price: null,
    learn: "appris : préfère les mouvements révisés",
    gradient: "linear-gradient(140deg,#4a3f33,#171310)",
    meta: "Montres · il y a 2 sem. · Drouot",
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
    return `Tu as gagné « ${won.lotTitle} » à €${won.price} en restant sous la cote — même discipline ici, plafond €${advisory.userCeiling}.`;
  }

  const lost = pool.find((e) => e.outcome === "lost" && e.price !== null);
  if (lost && lost.price !== null) {
    return `Tu as tenu ta limite sur « ${lost.lotTitle} » la dernière fois — je suggère de garder €${advisory.userCeiling} en plafond ici.`;
  }

  const passed = pool.find((e) => e.outcome === "passed");
  if (passed) {
    return `Tu avais passé « ${passed.lotTitle} » — ${passed.learn.replace("appris : ", "")}.`;
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
