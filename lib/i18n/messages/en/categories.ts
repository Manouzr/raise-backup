export const categories = {
  // header
  title: "Scanned categories",
  subtitle: "Tell it what to hunt — BidEdge queries Drouot and sets the live market rate.",
  stat: {
    category: "category",
    categories: "categories",
    activeAuctions: "active auctions",
    belowMarket: "below market",
  },
  // add bar
  addPlaceholder: "Add a category… e.g. 'vintage hi-fi headphones'",
  scan: "Scan",
  naturalHint: "Natural language works — e.g. 'iphone 17 under €500 no cases'",
  // empty state + footer
  emptyTitle: "No categories scanned",
  emptyBody:
    "Describe what you're hunting in the bar above — BidEdge sets the market rate, watches the auctions and shows you where the edge is.",
  footer: "The scan suggests, you decide — every bid is placed on Drouot, by your own hand. Never autobid.",
  // toast notifications
  notify: {
    nameFirst: "Name a category first",
    already: "That category is already scanned",
    scanStarted: "Scan started: {name}",
    removed: "“{name}” removed from the radar",
    alertOn: "Alert on",
    alertOff: "Alert off",
  },
  // basis labels
  basis: {
    sold90d: "sold · 90d",
    activeListings: "active listings",
  },
  // category panel
  panel: {
    rateSet: "Rate set",
    scanning: "scanning…",
    comparables: "comparables · just now",
    remove: "Remove",
    errorUnavailable: "Rate unavailable — check that the Drouot service is running.",
    retry: "Retry",
    notEnough: "Not enough comparables to set a reliable rate.",
    rescan: "Rescan",
    bestLot: "best lot · {price}",
    bandHint: "green zone = what the market pays · the dot = the top live bid",
    liveMarket: "The live market",
    closingPrices: "closing prices",
    belowMarketDot: "● below market",
    reliableRange: "reliable range",
    profitableUpTo: "profitable up to",
    auctions: "auctions",
    belowMarket: "below market",
    seeOnRadar: "see on radar →",
    bestOpportunities: "Best opportunities",
    nothingBelow: "Nothing below market yet",
    nothingBelowBody: "The scan keeps running — good deals always surface eventually.",
    alertPre: "Alert me when a lot drops below",
    alertPost: "of the rate",
  },
  // Gemini scan plan
  plan: {
    understood: "Understood: {query}",
    excluded: "excluded: {keywords}",
    partsExcluded: "parts listings skipped",
    cap: "cap",
  },
  // opportunity card
  opportunity: {
    bids: "bids",
    closesIn: "closes in",
    analyze: "Analyze",
    reading: "Reading…",
    unavailable: "Analysis unavailable",
    finalMax: "final max",
    open: "open →",
    collapse: "collapse ↑",
    seeAnalysis: "See the full analysis",
    details: "details ↓",
  },
} as const;
