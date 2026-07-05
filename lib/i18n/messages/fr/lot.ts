export const lot = {
  backRadar: "← Radar",
  closesIn: "Ferme dans",
  currentBid: "Enchère actuelle",
  vsQuote: "{edge} vs cote",
  sellerKind: {
    pro: "Pro",
    particulier: "Particulier",
    maison: "Maison",
  },
  sales: "ventes",
  positiveFeedback: "d'avis positifs",
  category: "Catégorie",
  statedCondition: "État annoncé",
  agentRead: "Lecture agent",
  yourLimit: "Ta limite",
  save: "Enregistrer",
  limitSaved: "Limite enregistrée — l'advisory s'en servira",
  comparables: "Cote du produit — ventes comparables",
  // Badges de risque — partagés par le modal du radar et la page catégories.
  risk: {
    sain: "Annonce saine",
    vigilance: "Vigilance",
    eviter: "À éviter",
  },
  confidence: "confiance",
  // Graphe de marché (partagé).
  chart: {
    empty: "Pas encore assez d'enchères actives pour tracer la tendance.",
    ended: "clôt.",
    days: "{n}j",
    hours: "{n}h",
    mins: "{n}m",
  },
} as const;
