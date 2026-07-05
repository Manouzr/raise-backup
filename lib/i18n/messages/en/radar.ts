export const radar = {
  title: "Radar",
  liveBadge: "eBay live",

  windows: { "6h": "6h", "24h": "24h", "3d": "3d" },
  windowTooltip: "Auctions closing within {window}",

  sort: { closing: "closing soon", edge: "best edge" },

  alerts: {
    onTitle: "Alerts on — click to mute",
    offTitle: "Alerts off — click to enable",
    blockedTitle: "Notifications blocked by the browser",
    enabledBody: "Alerts on — you'll be notified the moment a lot drops below −{n}% of market value.",
    enabledShort: "Alerts on.",
    blockedNotify: "Notifications blocked by the browser — allow them in the site settings",
  },

  subtitle: {
    dealsPrefix: "Your best deal first, then",
    dealsSuffix: "others below market value.",
    loading: "Querying eBay live…",
    watching: "I'm watching your categories — I'll show you deals the moment they drop below market value.",
  },

  chips: {
    all: "All",
    removeTitle: "Stop monitoring",
  },
  addPlaceholder: "Add a type… e.g. “vintage hi-fi headphones”",
  addButton: "Monitor",

  plan: {
    understood: "Understood: {query}",
    excluded: "excluded: {list}",
    capLabel: "cap",
    partsExcluded: "excluded as parts",
  },

  empty: {
    scanningTitle: "Scanning eBay auctions…",
    noneTitle: "No active auctions found",
    scanningHint: "Querying eBay for your product types — market value and lots are on the way.",
    noneHint: "Add a product type to monitor, or check that the eBay service is running (ebay-service).",
  },

  noDeals: {
    title: "Nothing below market yet",
    body: "The {n} live auctions are at market price. I'll alert you the moment a good deal shows up — keep alerts on.",
  },

  section: {
    bestNow: "The best deal right now",
    next: "Up next",
    showMore: "Show {n} more opportunities",
    rest: "The rest of the market",
  },

  footer: "The scan suggests, you decide — and you place every bid yourself on eBay. Never any autobid.",

  notify: {
    belowMarket: "Below market: {title} · {price} ({edge})",
    belowMarketTitle: "BidEdge — below market",
    nameType: "Name a product type to monitor",
    alreadyMonitored: "This type is already monitored",
    monitoringStarted: "Monitoring started: {type}",
  },

  card: {
    belowMarket: "below market",
    bids: "{n} bids",
  },

  band: {
    market: "market {price}",
  },

  hero: {
    belowMarket: "below market",
    closesIn: "closes in {time}",
    aiReading: "AI reading the listing…",
    realConditionLabel: "Real condition (AI):",
    aiAvoid: "AI advises against — check the listing.",
  },

  currentBidLabel: "Current bid",

  budget: {
    within: "within your limit",
    over: "over your limit",
  },

  market: {
    median: "Median market value",
    maxPrice: "max price",
    edgeVsMarket: "{edge} vs market",
    rangeLabel: "range",
    aiAdjusted: "(AI-adjusted)",
    comparables: "comparables",
  },

  actions: {
    openEbay: "Open on eBay",
    viewDetail: "View details",
    follow: "Follow",
  },

  row: {
    aiReading: "AI reading…",
    maxLabel: "max",
    analyze: "analyze",
  },

  basis: {
    sold90d: "sold in last 90d",
    activeListings: "active listings",
  },

  modal: {
    settingQuote: "Establishing market value…",
    basisLabel: "market:",
    quoteUnavailable:
      "No market value for this type — check the eBay service, or Marketplace Insights access for completed sales.",
    aiReadingTitle: "Listing read (AI)",
    aiReadingLoading: "Reading the listing…",
    noRedFlags: "No red flags in the listing.",
    confidenceLabel: "confidence",
    aiUnavailable: "AI analysis unavailable.",
    aiAvoid: "AI advises against this lot — check the listing before bidding.",
    selfBid: "You place the bid yourself on eBay — no autobid.",
  },

  verdict: {
    belowRisky: "Below market, but risky listing",
    belowMargin: "Below market, with margin",
    noMargin: "Not enough margin",
  },
} as const;
