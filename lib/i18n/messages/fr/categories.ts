export const categories = {
  // header
  title: "Catégories scannées",
  subtitle: "Dis quoi chasser — BidEdge interroge Drouot et établit la cote du marché en direct.",
  stat: {
    category: "catégorie",
    categories: "catégories",
    activeAuctions: "enchères actives",
    belowMarket: "sous la cote",
  },
  // add bar
  addPlaceholder: "Ajouter une catégorie… ex. « casque hi-fi vintage »",
  scan: "Scanner",
  naturalHint: "Langage naturel accepté — ex. “iphone 17 sous 500€ sans coques”",
  // empty state + footer
  emptyTitle: "Aucune catégorie scannée",
  emptyBody:
    "Décris ce que tu chasses dans la barre ci-dessus — BidEdge établit la cote, surveille les enchères et te montre où est l'avantage.",
  footer: "Le scan propose, toi tu choisis — chaque enchère se place sur Drouot, de ta main. Jamais d'autobid.",
  // toast notifications
  notify: {
    nameFirst: "Nomme une catégorie d'abord",
    already: "Cette catégorie est déjà scannée",
    scanStarted: "Scan lancé : {name}",
    removed: "« {name} » retirée du radar",
    alertOn: "Alerte activée",
    alertOff: "Alerte désactivée",
  },
  // basis labels
  basis: {
    sold90d: "ventes conclues · 90 j",
    activeListings: "annonces actives",
  },
  // category panel
  panel: {
    rateSet: "Cote établie",
    scanning: "scan en cours…",
    comparables: "comparables · à l'instant",
    remove: "Retirer",
    errorUnavailable: "Cote indisponible — vérifie que le service Drouot est bien lancé.",
    retry: "Réessayer",
    notEnough: "Pas assez de comparables pour établir une cote fiable.",
    rescan: "Relancer le scan",
    bestLot: "meilleur lot · {price}",
    bandHint: "la zone verte = ce que le marché paie · le point = la meilleure enchère en cours",
    liveMarket: "Le marché en direct",
    closingPrices: "prix à la clôture",
    belowMarketDot: "● sous la cote",
    reliableRange: "fourchette fiable",
    profitableUpTo: "rentable jusqu'à",
    auctions: "enchères",
    belowMarket: "sous la cote",
    seeOnRadar: "voir au radar →",
    bestOpportunities: "Meilleures opportunités",
    nothingBelow: "Rien sous la cote pour l'instant",
    nothingBelowBody: "Le scan continue — les bonnes affaires finissent toujours par sortir.",
    alertPre: "M'alerter quand un lot passe sous",
    alertPost: "de la cote",
  },
  // Gemini scan plan
  plan: {
    understood: "Compris : {query}",
    excluded: "exclu : {keywords}",
    partsExcluded: "pour pièces écartées",
    cap: "plafond",
  },
  // opportunity card
  opportunity: {
    bids: "enchères",
    closesIn: "ferme dans",
    analyze: "Analyser",
    reading: "Lecture…",
    unavailable: "Analyse indisponible",
    finalMax: "max final",
    open: "ouvrir →",
    collapse: "replier ↑",
    seeAnalysis: "Voir le détail de l'analyse",
    details: "détails ↓",
  },
} as const;
