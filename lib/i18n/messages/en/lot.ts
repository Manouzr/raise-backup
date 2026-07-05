export const lot = {
  backRadar: "← Radar",
  closesIn: "Closes in",
  currentBid: "Current bid",
  vsQuote: "{edge} vs market",
  sellerKind: {
    pro: "Pro",
    particulier: "Private",
    maison: "House",
  },
  sales: "sales",
  positiveFeedback: "positive feedback",
  category: "Category",
  statedCondition: "Stated condition",
  agentRead: "Agent read",
  yourLimit: "Your limit",
  save: "Save",
  limitSaved: "Limit saved — the advisory will use it",
  comparables: "Product market rate — comparable sales",
  // Risk badges — shared by the radar modal and the categories page.
  risk: {
    sain: "Healthy",
    vigilance: "Caution",
    eviter: "Avoid",
  },
  confidence: "confidence",
  // Market chart (shared).
  chart: {
    empty: "Not enough active auctions yet to plot the trend.",
    ended: "end",
    days: "{n}d",
    hours: "{n}h",
    mins: "{n}m",
  },
} as const;
