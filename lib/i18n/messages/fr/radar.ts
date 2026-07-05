export const radar = {
  title: "Radar",
  liveBadge: "eBay en direct",

  windows: { "6h": "6 h", "24h": "24 h", "3d": "3 j" },
  windowTooltip: "Enchères qui ferment dans {window}",

  sort: { closing: "ferment bientôt", edge: "meilleur edge" },

  alerts: {
    onTitle: "Alertes activées — clique pour couper",
    offTitle: "Alertes coupées — clique pour activer",
    blockedTitle: "Notifications bloquées par le navigateur",
    enabledBody: "Alertes actives — tu seras prévenu dès qu'un lot descend sous −{n} % de la cote.",
    enabledShort: "Alertes actives.",
    blockedNotify: "Notifications bloquées par le navigateur — autorise-les dans tes réglages",
  },

  subtitle: {
    dealsPrefix: "Ta meilleure affaire d'abord, puis",
    dealsSuffix: "autres sous la cote.",
    loading: "On interroge eBay en direct…",
    watching: "Je surveille tes catégories — je te montre les affaires dès qu'elles passent sous la cote.",
  },

  chips: {
    all: "Tous",
    removeTitle: "Ne plus monitorer",
  },
  addPlaceholder: "Ajouter un type… ex. « casque hi-fi vintage »",
  addButton: "Monitorer",

  plan: {
    understood: "Compris : {query}",
    excluded: "exclu : {list}",
    capLabel: "plafond",
    partsExcluded: "pour pièces écartées",
  },

  empty: {
    scanningTitle: "Scan des enchères eBay en cours…",
    noneTitle: "Aucune enchère active trouvée",
    scanningHint: "On interroge eBay pour tes types de produits — la cote et les lots arrivent.",
    noneHint: "Ajoute un type de produit à monitorer, ou vérifie que le service eBay tourne (ebay-service).",
  },

  noDeals: {
    title: "Rien sous la cote pour l'instant",
    body: "Ces {n} enchères en cours sont au prix du marché. Je t'alerterai dès qu'une affaire digne d'intérêt sort — laisse les alertes activées.",
  },

  section: {
    bestNow: "La meilleure affaire maintenant",
    next: "À regarder ensuite",
    showMore: "Voir {n} autres opportunités",
    rest: "Le reste du marché",
  },

  footer: "Le scan propose, toi tu choisis — et tu places chaque enchère toi-même sur eBay. Jamais d'autobid.",

  notify: {
    belowMarket: "Sous la cote : {title} · {price} ({edge})",
    belowMarketTitle: "BidEdge — sous la cote",
    nameType: "Nomme un type de produit à monitorer",
    alreadyMonitored: "Ce type est déjà monitoré",
    monitoringStarted: "Monitoring lancé : {type}",
  },

  card: {
    belowMarket: "sous la cote",
    bids: "{n} ench.",
  },

  band: {
    market: "cote {price}",
  },

  hero: {
    belowMarket: "sous la cote",
    closesIn: "ferme dans {time}",
    aiReading: "Lecture de l'annonce par l'IA…",
    realConditionLabel: "État réel (IA) :",
    aiAvoid: "L'IA déconseille — vérifie l'annonce.",
  },

  currentBidLabel: "Enchère actuelle",

  budget: {
    within: "dans ta limite",
    over: "au-dessus de ta limite",
  },

  market: {
    median: "Cote médiane",
    maxPrice: "prix max",
    edgeVsMarket: "{edge} vs cote",
    rangeLabel: "fourchette",
    aiAdjusted: "(ajusté IA)",
    comparables: "comparables",
  },

  actions: {
    openEbay: "Ouvrir sur eBay",
    viewDetail: "Voir le détail",
    follow: "Suivre",
  },

  row: {
    aiReading: "lecture IA…",
    maxLabel: "max",
    analyze: "analyser",
  },

  basis: {
    sold90d: "ventes conclues 90 j",
    activeListings: "annonces actives",
  },

  modal: {
    settingQuote: "Établissement de la cote…",
    basisLabel: "cote :",
    quoteUnavailable:
      "Cote indisponible pour ce type — vérifie le service eBay, ou l'accès Marketplace Insights pour les ventes conclues.",
    aiReadingTitle: "Lecture de l'annonce (IA)",
    aiReadingLoading: "Lecture de l'annonce…",
    noRedFlags: "Aucun signal d'alerte dans l'annonce.",
    confidenceLabel: "confiance",
    aiUnavailable: "Analyse IA indisponible.",
    aiAvoid: "L'IA déconseille ce lot — vérifie l'annonce avant toute enchère.",
    selfBid: "Tu enchéris toi-même sur eBay — pas d'autobid.",
  },

  verdict: {
    belowRisky: "Sous la cote, mais annonce à risque",
    belowMargin: "Sous la cote, avec marge",
    noMargin: "Pas de marge suffisante",
  },
} as const;
